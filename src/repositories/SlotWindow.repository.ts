import { QueryTypes } from 'sequelize';

import sequelize from '../db/models/sequelize';

/**
 * Keeps the bookable calendar generated ahead of time.
 *
 * Both statements are idempotent and only ever INSERT missing rows:
 *  - existing booking_dates are left untouched (an admin-disabled date stays disabled)
 *  - existing date_time_slots are left untouched (booked / reserved / blocked slots keep their status)
 */
class SlotWindowRepository {
    async createMissingBookingDates(fromDate: string, toDate: string): Promise<number> {
        const [, affectedRows] = await sequelize.query(
            `
            INSERT INTO booking_dates (booking_date, is_active, created_at, updated_at)
            WITH RECURSIVE date_series AS (
                SELECT DATE(:fromDate) AS booking_date
                UNION ALL
                SELECT DATE_ADD(booking_date, INTERVAL 1 DAY)
                FROM date_series
                WHERE booking_date < DATE(:toDate)
            )
            SELECT booking_date, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM date_series
            ON DUPLICATE KEY UPDATE booking_dates.id = booking_dates.id
            `,
            { replacements: { fromDate, toDate }, type: QueryTypes.INSERT }
        );

        return Number(affectedRows);
    }

    async createMissingDateTimeSlots(fromDate: string, toDate: string): Promise<number> {
        const [, affectedRows] = await sequelize.query(
            `
            INSERT INTO date_time_slots (
                booking_date_id,
                booking_time_slot_id,
                slot_start_at,
                status,
                created_at,
                updated_at
            )
            SELECT
                bd.id,
                bts.id,
                TIMESTAMP(bd.booking_date, bts.slot_time),
                'available',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            FROM booking_dates bd
            CROSS JOIN booking_time_slots bts
            WHERE bd.booking_date BETWEEN DATE(:fromDate) AND DATE(:toDate)
              AND bd.is_active = TRUE
              AND bd.deleted_at IS NULL
              AND bts.is_active = TRUE
              AND bts.deleted_at IS NULL
            ON DUPLICATE KEY UPDATE date_time_slots.id = date_time_slots.id
            `,
            { replacements: { fromDate, toDate }, type: QueryTypes.INSERT }
        );

        return Number(affectedRows);
    }
}

export default SlotWindowRepository;
