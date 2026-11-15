/**
 * Queues the bookings made BEFORE the CRM connection was switched on, so they reach the CRM too.
 *
 *   npm run crm:backfill -- --since=2026-10-01        (development)
 *   node dist/scripts/crmBackfill.js --since=2026-10-01   (production image)
 *
 * It only writes rows to crm_outbox; the running service sends them. Safe to run again: every event's id comes from the booking (and, for "done", the time it was marked done),
 * so the queue ignores what it already has and the CRM ignores what it has already applied. Without --since, every confirmed or completed booking is queued.
 * Run the form service's backfill too: it sends the details and the form answers of the same people.
 */
import { Op } from 'sequelize';

import { setupAssociations } from '../db/models/associations';
import Booking from '../db/models/Booking.model';
import sequelize from '../db/models/sequelize';
import CrmOutboxRepository from '../repositories/CrmOutbox.repository';
import { CRM_EVENT_BOOKED, CRM_EVENT_COMPLETED, eventIdFor } from '../services/CrmSync.service';
import { BookingStatus } from '../utils/enums/BookingStatus';

async function main(): Promise<void> {
    const sinceArg = process.argv.find((arg) => arg.startsWith('--since='))?.slice('--since='.length);
    const since = sinceArg ? new Date(sinceArg) : null;
    if (since && Number.isNaN(since.getTime())) {
        throw new Error(`--since must be a date like 2026-10-01, got "${sinceArg}"`);
    }

    setupAssociations();
    await sequelize.authenticate();

    const outbox = new CrmOutboxRepository();
    const PAGE = 500;
    let lastId = 0;
    let booked = 0;
    let completed = 0;

    for (;;) {
        const rows = await Booking.findAll({
            where: {
                id: { [Op.gt]: lastId },
                status: { [Op.in]: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
                ...(since ? { confirmedAt: { [Op.gte]: since } } : {})
            },
            attributes: ['id', 'status', 'completedAt'],
            order: [['id', 'ASC']],
            limit: PAGE
        });
        if (rows.length === 0) {
            break;
        }

        for (const row of rows) {
            if (await outbox.enqueue(eventIdFor(CRM_EVENT_BOOKED, row.id), CRM_EVENT_BOOKED, BigInt(row.id))) {
                booked += 1;
            }
            if (
                row.status === BookingStatus.COMPLETED &&
                row.completedAt &&
                (await outbox.enqueue(eventIdFor(CRM_EVENT_COMPLETED, row.id, row.completedAt), CRM_EVENT_COMPLETED, BigInt(row.id)))
            ) {
                completed += 1;
            }
        }
        lastId = Number(rows[rows.length - 1].id);
    }

    console.log(`Queued ${booked} "booked a call" and ${completed} "call done" events${since ? ` since ${since.toISOString()}` : ''}.`);
    console.log('They are sent by the running service, a few at a time. Check progress in crm_outbox (status PENDING -> SENT).');
    await sequelize.close();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
