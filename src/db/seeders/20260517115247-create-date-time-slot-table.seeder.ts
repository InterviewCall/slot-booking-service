import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            INSERT INTO date_time_slots (
                booking_date_id,
                booking_time_slot_id,
                slot_start_at,
                status,
                created_at,
                updated_at
            )
            SELECT
                bd.id AS booking_date_id,
                bts.id AS booking_time_slot_id,
                TIMESTAMP(bd.booking_date, bts.slot_time) AS slot_start_at,
                'available' AS status,
                CURRENT_TIMESTAMP AS created_at,
                CURRENT_TIMESTAMP AS updated_at
            FROM booking_dates bd
            CROSS JOIN booking_time_slots bts
            WHERE bd.is_active = TRUE
            AND bts.is_active = TRUE
            AND bd.deleted_at IS NULL
            AND bts.deleted_at IS NULL
            ON DUPLICATE KEY UPDATE
                slot_start_at = VALUES(slot_start_at),
                updated_at = CURRENT_TIMESTAMP;
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DELETE dts
            FROM date_time_slots dts
            LEFT JOIN bookings b
                ON b.date_time_slot_id = dts.id
                AND b.deleted_at IS NULL
            WHERE b.id IS NULL;
        `);
    }
};
