import axios from 'axios';
import { Transaction } from 'sequelize';

import { candidateFormDetailsApi } from '../configs/axios.config';
import logger from '../configs/logger.config';
import { crmConfig } from '../configs/server.config';
import Booking from '../db/models/Booking.model';
import BookingRepository from '../repositories/Booking.repository';
import CrmOutboxRepository from '../repositories/CrmOutbox.repository';
import { CandidateDetailsResponse, FormSubmissionDetailsResponse } from '../types/Response.type';
import { BookingStatus } from '../utils/enums/BookingStatus';
import { formatBookingDate } from '../utils/helpers/formatBookingDate.helper';

export const CRM_EVENT_BOOKED = 'vsl.slot_booked';
export const CRM_EVENT_COMPLETED = 'vsl.booking_completed';
export const CRM_EVENT_REOPENED = 'vsl.booking_reopened';

type CrmEventType = typeof CRM_EVENT_BOOKED | typeof CRM_EVENT_COMPLETED | typeof CRM_EVENT_REOPENED;

interface CrmEnvelope {
    eventId: string;
    type: CrmEventType;
    occurredAt: string;
    payload: Record<string, unknown>;
}

/** What building an event can come to: send it, or drop it for a reason a person can read in the queue. */
type Built = { envelope: CrmEnvelope } | { skip: string };

// 30s, 2m, 10m, then every 30m for as long as the CRM stays unreachable. An event is never dropped for being slow to deliver.
const BACKOFF_MS = [30 * 1000, 2 * 60 * 1000, 10 * 60 * 1000, 30 * 60 * 1000];
const LEASE_MS = 2 * 60 * 1000;
const BATCH = 25;

/**
 * A booking is booked once, so its id never changes. "Done" and "done taken back" can happen many times to the same
 * booking (done, undone, done again), so their ids carry the moment of the change: each change is a new event, and
 * the same change queued twice (a retry, a backfill) is still one. Without the moment, the second "done" would find the
 * first one's row and never be sent.
 */
export const eventIdFor = (type: CrmEventType, bookingId: bigint | string, at: Date = new Date()): string => {
    const id = String(bookingId);
    if (type === CRM_EVENT_BOOKED) {
        return `vsl-booked-${id}`;
    }
    const moment = type === CRM_EVENT_COMPLETED ? Math.floor(at.getTime() / 1000) : at.getTime();
    return `${type === CRM_EVENT_COMPLETED ? 'vsl-completed' : 'vsl-reopened'}-${id}-${moment}`;
};

/**
 * Sends the last two funnel steps to the CRM: "booked a counselling call" and "the call took place".
 * (The form service sends "gave details" and "filled the form".)
 *
 * The event is written to crm_outbox in the same transaction that changes the booking, and sent afterwards from there,
 * so a CRM outage never loses a booking and never slows or breaks the candidate's page or the admin panel. The message
 * is built from the database (and the form service, for who the person is) at send time, so it is complete and current.
 */
class CrmSyncService {
    private timer: NodeJS.Timeout | null = null;
    private running = false;
    private rerun = false;

    constructor(
        private readonly outbox: CrmOutboxRepository,
        private readonly bookings: BookingRepository
    ) {}

    /**
     * Call inside the transaction that changes the booking. Never throws: a problem here must not break the booking.
     * `at` is when the change happened (for "done", the completedAt the admin sees); it makes the event's id.
     */
    async enqueue(type: CrmEventType, bookingId: bigint | string, transaction: Transaction, at: Date = new Date()): Promise<void> {
        if (!crmConfig.ENABLED) {
            return;
        }

        try {
            await this.outbox.enqueue(eventIdFor(type, bookingId, at), type, BigInt(bookingId), transaction);
        } catch (error) {
            logger.error('Could not queue the CRM event', { type, bookingId: String(bookingId), error });
        }
    }

    /** Call after the transaction committed: sends what is waiting without making the caller wait. */
    kick(): void {
        if (!crmConfig.ENABLED) {
            return;
        }
        setImmediate(() => void this.flush());
    }

    start(): void {
        if (!crmConfig.ENABLED) {
            logger.info('CRM sync is off (CRM_SYNC_ENABLED is not true)');
            return;
        }
        if (!crmConfig.BASE_URL || !crmConfig.INTAKE_KEY) {
            logger.error('CRM sync is on but CRM_BASE_URL or CRM_INTAKE_KEY is missing: nothing will be delivered');
        }
        if (this.timer) {
            return;
        }
        this.timer = setInterval(() => void this.flush(), crmConfig.POLL_MS);
        this.timer.unref();
        this.kick();
        logger.info('CRM sync started', { baseUrl: crmConfig.BASE_URL });
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /** Sends every event that is due. One run at a time; a request that arrives meanwhile triggers one more pass. */
    async flush(): Promise<number> {
        if (!crmConfig.ENABLED || !crmConfig.BASE_URL || !crmConfig.INTAKE_KEY) {
            return 0;
        }
        if (this.running) {
            this.rerun = true;
            return 0;
        }

        this.running = true;
        let sent = 0;
        try {
            do {
                this.rerun = false;
                const due = await this.outbox.findDue(BATCH);
                for (const row of due) {
                    if (!(await this.outbox.claim(row.id, LEASE_MS))) {
                        continue;
                    }
                    if (await this.deliver(row.id, row.eventId, row.eventType as CrmEventType, BigInt(row.bookingId), row.attempts, row.createdAt)) {
                        sent += 1;
                    }
                }
                if (due.length === BATCH) {
                    this.rerun = true;
                }
            } while (this.rerun);
        } catch (error) {
            logger.error('CRM sync pass failed', error);
        } finally {
            this.running = false;
        }
        return sent;
    }

    private async deliver(id: number, eventId: string, type: CrmEventType, bookingId: bigint, attemptsSoFar: number, queuedAt: Date): Promise<boolean> {
        const attempts = attemptsSoFar + 1;
        try {
            const built = await this.build(eventId, type, bookingId, queuedAt);
            if ('skip' in built) {
                await this.outbox.markSkipped(id, attempts, built.skip);
                return false;
            }

            await axios.post(`${crmConfig.BASE_URL}/intake/events`, built.envelope, {
                timeout: crmConfig.TIMEOUT_MS,
                headers: { 'Content-Type': 'application/json', 'x-intake-key': crmConfig.INTAKE_KEY }
            });
            await this.outbox.markSent(id);
            return true;
        } catch (error) {
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            const fromCrm = axios.isAxiosError(error) && error.config?.url?.startsWith(crmConfig.BASE_URL);
            const reason = this.describe(error);

            // 400 from the CRM: it read the message and refused it. Sending it again cannot help, so it stops here for a person to look at.
            if (status === 400 && fromCrm) {
                logger.error('The CRM refused an event', { eventId, reason });
                await this.outbox.markFailed(id, attempts, reason);
                return false;
            }

            // 401/403 (key wrong or revoked), 5xx, timeouts, network, the form service being down: try again later.
            const wait = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
            logger.warn('CRM event not delivered, will retry', { eventId, attempts, reason });
            await this.outbox.markRetry(id, attempts, new Date(Date.now() + wait), reason);
            return false;
        }
    }

    private describe(error: unknown): string {
        if (axios.isAxiosError(error)) {
            const body = error.response?.data as { message?: unknown; error?: unknown } | undefined;
            const detail = typeof body?.message === 'string' ? body.message : typeof body?.error === 'string' ? body.error : '';
            return `${error.response?.status ?? error.code ?? 'network'}${detail ? `: ${detail}` : ''}`;
        }
        return error instanceof Error ? error.message : String(error);
    }

    private async build(eventId: string, type: CrmEventType, bookingId: bigint, queuedAt: Date): Promise<Built> {
        const booking = await this.bookings.findWithSlot(bookingId);
        if (!booking) {
            return { skip: 'The booking no longer exists' };
        }

        if (type === CRM_EVENT_REOPENED) {
            // If the admin marked the call done again before this was sent, "taking it back" is no longer true: skip it.
            if (booking.status !== BookingStatus.CONFIRMED) {
                return { skip: `The booking is ${booking.status}, not reopened` };
            }
            return {
                envelope: {
                    eventId,
                    type,
                    occurredAt: queuedAt.toISOString(),
                    // The CRM ignores this if the call was marked done again after this moment, whatever order the events are handled in.
                    payload: { bookingId: String(booking.id), submissionId: booking.submissionId, reopenedAt: queuedAt.toISOString() }
                }
            };
        }

        if (type === CRM_EVENT_COMPLETED) {
            // The admin can take "done" back. If they did before this was sent, there is nothing to tell the CRM.
            if (booking.status !== BookingStatus.COMPLETED || !booking.completedAt) {
                return { skip: `The booking is ${booking.status}, not completed` };
            }
            return {
                envelope: {
                    eventId,
                    type,
                    occurredAt: booking.completedAt.toISOString(),
                    payload: {
                        bookingId: String(booking.id),
                        submissionId: booking.submissionId,
                        completedAt: booking.completedAt.toISOString()
                    }
                }
            };
        }

        return { envelope: await this.bookedEnvelope(eventId, booking) };
    }

    private async bookedEnvelope(eventId: string, booking: Booking): Promise<CrmEnvelope> {
        const timeout = crmConfig.TIMEOUT_MS;

        // Who the person is lives in the form service. Two quick reads there; if it is down the event simply waits.
        const submission = (
            await candidateFormDetailsApi.get<FormSubmissionDetailsResponse>(`/submissions/${encodeURIComponent(booking.submissionId)}`, { timeout })
        ).data.data;
        const candidate = (
            await candidateFormDetailsApi.get<CandidateDetailsResponse>(`/candidates/${encodeURIComponent(submission.candidatePublicId)}`, { timeout })
        ).data.data;

        const slot = booking.dateTimeSlot!;
        return {
            eventId,
            type: CRM_EVENT_BOOKED,
            occurredAt: (booking.confirmedAt ?? booking.updatedAt).toISOString(),
            payload: {
                bookingId: String(booking.id),
                submissionId: booking.submissionId,
                formSlug: submission.formSlug ?? null,
                fullName: candidate.fullName,
                email: candidate.email,
                phone: candidate.phone,
                slotStartAt: slot.slotStartAt.toISOString(),
                // Reads like the confirmation email: "7th November, 2026, 12:30 PM"
                slotLabel: `${formatBookingDate(slot.bookingDate!.bookingDate)}, ${slot.timeSlot!.slotLabel}`
            }
        };
    }
}

export default CrmSyncService;
