import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS booking_time_slots (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                slot_time TIME NOT NULL UNIQUE,
                slot_label VARCHAR(50) NOT NULL,
                sort_order INT UNSIGNED NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL DEFAULT NULL,

                INDEX idx_booking_time_slots_is_active (is_active),
                INDEX idx_booking_time_slots_sort_order (sort_order)
            );
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS booking_time_slots;
        `);
    }
};
