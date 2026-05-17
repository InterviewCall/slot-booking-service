import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            SET @today := DATE(UTC_TIMESTAMP() + INTERVAL 330 MINUTE);
        `);

        await queryInterface.sequelize.query(`
            SET @end_date := DATE_ADD(@today, INTERVAL 3 MONTH);
        `);

        await queryInterface.sequelize.query(`
            INSERT INTO booking_dates (
                booking_date,
                is_active,
                created_at,
                updated_at
            )
            WITH RECURSIVE date_series AS (
                SELECT @today AS booking_date

                UNION ALL

                SELECT DATE_ADD(booking_date, INTERVAL 1 DAY)
                FROM date_series
                WHERE booking_date < @end_date
            )
            SELECT 
                booking_date,
                TRUE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            FROM date_series
            ON DUPLICATE KEY UPDATE
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP;
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            SET @today := DATE(UTC_TIMESTAMP() + INTERVAL 330 MINUTE);
        `);

        await queryInterface.sequelize.query(`
            SET @end_date := DATE_ADD(@today, INTERVAL 3 MONTH);
        `);

        await queryInterface.sequelize.query(`
            DELETE FROM booking_dates
            WHERE booking_date BETWEEN @today AND @end_date;
        `);
    }
};
