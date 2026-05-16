import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS booking_dates (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                booking_date DATE NOT NULL UNIQUE,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL DEFAULT NULL,

                INDEX idx_booking_dates_booking_date (booking_date),
                INDEX idx_booking_dates_is_active (is_active)
            );
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS booking_dates;
        `);
    }
};
