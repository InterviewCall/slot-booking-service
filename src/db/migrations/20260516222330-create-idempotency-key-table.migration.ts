import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS idempotency_keys (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                idem_key CHAR(36) NOT NULL UNIQUE,
                booking_id BIGINT UNSIGNED NOT NULL,
                finalized BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL DEFAULT NULL,

                CONSTRAINT fk_idempotency_keys_booking
                    FOREIGN KEY (booking_id)
                    REFERENCES bookings(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,

                INDEX idx_idempotency_keys_booking_id (booking_id),
                INDEX idx_idempotency_keys_finalized (finalized)
            );
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS idempotency_keys;
        `);
    }
};
