import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            INSERT INTO booking_time_slots (
                slot_time,
                slot_label,
                sort_order,
                is_active,
                created_at,
                updated_at
            )
            VALUES
                ('12:30:00', '12:30 PM', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('13:15:00', '01:15 PM', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('14:00:00', '02:00 PM', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('14:45:00', '02:45 PM', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('15:30:00', '03:30 PM', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('16:15:00', '04:15 PM', 6, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('17:00:00', '05:00 PM', 7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('17:45:00', '05:45 PM', 8, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('18:30:00', '06:30 PM', 9, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('19:15:00', '07:15 PM', 10, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                ('20:00:00', '08:00 PM', 11, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                slot_label = VALUES(slot_label),
                sort_order = VALUES(sort_order),
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP;
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DELETE FROM booking_time_slots
            WHERE slot_time IN (
                '12:30:00',
                '13:15:00',
                '14:00:00',
                '14:45:00',
                '15:30:00',
                '16:15:00',
                '17:00:00',
                '17:45:00',
                '18:30:00',
                '19:15:00',
                '20:00:00'
            );
        `);
    }
};
