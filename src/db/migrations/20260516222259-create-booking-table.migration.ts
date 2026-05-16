import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                date_time_slot_id BIGINT UNSIGNED NOT NULL,
                candidate_id BIGINT UNSIGNED NOT NULL,
                submission_id CHAR(36) NOT NULL,
                status ENUM(
                    'initiated',
                    'confirmed',
                    'cancelled',
                    'completed',
                    'no_show'
                ) NOT NULL DEFAULT 'initiated',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL DEFAULT NULL,

                CONSTRAINT fk_bookings_date_time_slot
                    FOREIGN KEY (date_time_slot_id)
                    REFERENCES date_time_slots(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,

                INDEX idx_bookings_date_time_slot_id (date_time_slot_id),
                INDEX idx_bookings_candidate_id (candidate_id),
                INDEX idx_bookings_submission_id (submission_id),
                INDEX idx_bookings_status (status)
            );
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS bookings;
        `);
    }
};
