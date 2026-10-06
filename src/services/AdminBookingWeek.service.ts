import { lookupSubmissions } from '../apis/candidateFormDetailsService.api';
import { lookupNotificationsBySubmissionIds } from '../apis/notificationService.api';
import logger from '../configs/logger.config';
import { CALL_PREP_ANSWER_KEYS, HOLD_DURATION_MS, NOTIFICATION_SERVICE_UNAVAILABLE_WARNING } from '../constants/adminBooking';
import Booking from '../db/models/Booking.model';
import DateTimeSlot from '../db/models/DateTimeSlot.model';
import BookingRepository from '../repositories/Booking.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import {
    AdminBookingItem,
    AdminBookingsWeekResponse,
    AdminBookingsWeekSummary,
    AdminNotificationItem,
    AdminWeekDay,
    AdminWeekSlot,
    NotificationLookupFn,
    SubmissionLookupFn,
    SubmissionLookupItem,
} from '../types/AdminBooking.type';
import { BookingStatus } from '../utils/enums/BookingStatus';
import { TimeSlotStatus } from '../utils/enums/TimeSlotStatus';
import { BadGatewayError } from '../utils/errors/app.error';
import { addDaysToIstDate, getWeekRange, toIstDate } from '../utils/helpers/weekRange.helper';

class AdminBookingWeekService {
    constructor(
        private readonly bookingRepository: BookingRepository,
        private readonly dateTimeSlotRepository: DateTimeSlotRepository,
        private readonly lookupSubmissionDetails: SubmissionLookupFn = lookupSubmissions,
        private readonly lookupNotifications: NotificationLookupFn = lookupNotificationsBySubmissionIds
    ) {}

    async getWeek(weekStart: string, now: Date = new Date()): Promise<AdminBookingsWeekResponse> {
        const { start, end } = getWeekRange(weekStart);

        const [slots, bookings, nextCallAt] = await Promise.all([
            this.dateTimeSlotRepository.findSlotsInRange(start, end),
            this.bookingRepository.findCountedBookingsInRange(start, end, new Date(now.getTime() - HOLD_DURATION_MS)),
            this.bookingRepository.findNextConfirmedCallAt(now),
        ]);

        const submissionIds = [...new Set(bookings.map((booking) => booking.submissionId))];

        // Candidate details are the point of the page, so without them we cannot answer (502).
        // Message deliveries only decorate it, so without them the bookings are still shown (with a warning).
        const [submissions, notifications] = await Promise.all([
            this.fetchSubmissions(submissionIds),
            this.fetchNotifications(submissionIds),
        ]);

        const items = bookings.map((booking) => this.toBookingItem(booking, submissions.get(booking.submissionId), notifications.byBooking));
        const days = this.buildDays(weekStart, slots);

        return {
            weekStart,
            bookings: items,
            days,
            summary: this.buildSummary(items, days, notifications.failedDeliveryCount(bookings), nextCallAt, now),
            ...(notifications.available ? {} : { warnings: [NOTIFICATION_SERVICE_UNAVAILABLE_WARNING] }),
        };
    }

    private async fetchSubmissions(submissionIds: string[]): Promise<Map<string, SubmissionLookupItem>> {
        if (submissionIds.length === 0) {
            return new Map();
        }

        try {
            const submissions = await this.lookupSubmissionDetails(submissionIds, CALL_PREP_ANSWER_KEYS);
            return new Map(submissions.map((submission) => [submission.submissionId, submission]));
        } catch (error) {
            logger.error('Candidate lookup for the bookings week failed', { error: error instanceof Error ? error.message : error });
            throw new BadGatewayError('Could not load the candidate details. Please try again.');
        }
    }

    private async fetchNotifications(submissionIds: string[]) {
        const byBooking = new Map<string, AdminNotificationItem[]>();
        let available = true;

        if (submissionIds.length > 0) {
            try {
                const deliveries = await this.lookupNotifications(submissionIds);
                for (const delivery of deliveries) {
                    // Only the booking confirmation belongs to a booked call. "Not booked yet" reminders do not.
                    if (delivery.notificationType !== 'BOOKING_CONFIRMED' || delivery.bookingId === null) {
                        continue;
                    }

                    const list = byBooking.get(delivery.bookingId) ?? [];
                    list.push({
                        id: delivery.id,
                        notificationType: 'BOOKING_CONFIRMED',
                        reminderNumber: delivery.reminderNumber,
                        channel: delivery.channel,
                        sendStatus: delivery.sendStatus,
                        failedReason: delivery.failedReason,
                    });
                    byBooking.set(delivery.bookingId, list);
                }
            } catch (error) {
                logger.error('Notification lookup for the bookings week failed', { error: error instanceof Error ? error.message : error });
                available = false;
            }
        }

        return {
            byBooking,
            available,
            // Failed deliveries of confirmed bookings, one per failed channel.
            failedDeliveryCount: (bookings: Booking[]) =>
                bookings
                    .filter((booking) => booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED)
                    .reduce(
                        (total, booking) =>
                            total + (byBooking.get(String(booking.id)) ?? []).filter((item) => item.sendStatus === 'FAILED').length,
                        0
                    ),
        };
    }

    private toBookingItem(booking: Booking, submission: SubmissionLookupItem | undefined, notificationsByBooking: Map<string, AdminNotificationItem[]>): AdminBookingItem {
        const answers = submission?.answers ?? {};

        return {
            bookingId: String(booking.id),
            slotStartAt: booking.dateTimeSlot!.slotStartAt.toISOString(),
            status: booking.status,
            completedAt: booking.completedAt ? booking.completedAt.toISOString() : null,
            submissionId: booking.submissionId,
            formName: submission?.formName ?? '',
            // The form service no longer has this submission (deleted): keep the booking visible rather than hide a real call.
            candidate: submission?.candidate ?? { fullName: 'Unknown candidate', email: '', phone: '' },
            leadScore: submission?.leadScore ?? null,
            leadTemperature: submission?.leadTemperature ?? null,
            notifications: notificationsByBooking.get(String(booking.id)) ?? [],
            callPrep: {
                experience: answers.yoe ?? null,
                currentCtc: answers.currentCtc ?? null,
                mainGap: answers.mainGap ?? null,
                urgency: answers.urgency ?? null,
            },
        };
    }

    private buildDays(weekStart: string, slots: DateTimeSlot[]): AdminWeekDay[] {
        const slotsByDate = new Map<string, AdminWeekSlot[]>();

        for (const slot of slots) {
            const date = toIstDate(slot.slotStartAt);
            const list = slotsByDate.get(date) ?? [];
            list.push({
                slotId: slot.id,
                slotStartAt: slot.slotStartAt.toISOString(),
                // An hour or a date that is switched off cannot be booked, so it is shown as blocked, never as free.
                status:
                    slot.status === TimeSlotStatus.AVAILABLE && (!slot.timeSlot?.isActive || !slot.bookingDate?.isActive)
                        ? TimeSlotStatus.BLOCKED
                        : slot.status,
            });
            slotsByDate.set(date, list);
        }

        return Array.from({ length: 7 }, (_, dayIndex) => {
            const date = addDaysToIstDate(weekStart, dayIndex);
            return { date, slots: slotsByDate.get(date) ?? [] };
        });
    }

    private buildSummary(
        items: AdminBookingItem[],
        days: AdminWeekDay[],
        failedMessages: number,
        nextCallAt: Date | null,
        now: Date
    ): AdminBookingsWeekSummary {
        const today = toIstDate(now);
        // A call that was marked done is still a confirmed booking, it just no longer waits for the admin.
        const waiting = items.filter((item) => item.status === BookingStatus.CONFIRMED);
        const completed = items.filter((item) => item.status === BookingStatus.COMPLETED);
        const confirmed = [...waiting, ...completed];

        // Capacity looks forward only: slots that already started cannot be sold any more.
        const upcoming = days.flatMap((day) => day.slots).filter((slot) => new Date(slot.slotStartAt).getTime() > now.getTime());
        const used = upcoming.filter((slot) => slot.status === TimeSlotStatus.BOOKED || slot.status === TimeSlotStatus.RESERVED).length;
        const usable = used + upcoming.filter((slot) => slot.status === TimeSlotStatus.AVAILABLE).length;

        return {
            callsToday: confirmed.filter((item) => toIstDate(new Date(item.slotStartAt)) === today).length,
            confirmedThisWeek: confirmed.length,
            completedThisWeek: completed.length,
            // Confirmed calls whose time has come but that the admin has not marked done yet.
            callsToMark: waiting.filter((item) => new Date(item.slotStartAt).getTime() <= now.getTime()).length,
            heldThisWeek: items.filter((item) => item.status === BookingStatus.INITIATED).length,
            cancelledThisWeek: items.filter((item) => item.status === BookingStatus.CANCELLED).length,
            capacityUsedPercent: usable === 0 ? 0 : Math.round((used / usable) * 100),
            failedMessages,
            nextCallAt: nextCallAt ? nextCallAt.toISOString() : null,
        };
    }
}

export default AdminBookingWeekService;
