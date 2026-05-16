import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS date_time_slots (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                booking_date_id BIGINT UNSIGNED NOT NULL,
                booking_time_slot_id INT UNSIGNED NOT NULL,
                slot_start_at DATETIME NOT NULL,
                status ENUM('available', 'blocked', 'booked') NOT NULL DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL DEFAULT NULL,

                CONSTRAINT fk_date_time_slots_booking_date
                    FOREIGN KEY (booking_date_id)
                    REFERENCES booking_dates(id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,

                CONSTRAINT fk_date_time_slots_booking_time_slot
                    FOREIGN KEY (booking_time_slot_id)
                    REFERENCES booking_time_slots(id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,

                UNIQUE KEY uq_date_time_slot (booking_date_id, booking_time_slot_id),

                INDEX idx_date_time_slots_date_status_start (booking_date_id, status, slot_start_at),
                INDEX idx_date_time_slots_status_start (status, slot_start_at)
            );
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS date_time_slots;
        `);
    }
};
