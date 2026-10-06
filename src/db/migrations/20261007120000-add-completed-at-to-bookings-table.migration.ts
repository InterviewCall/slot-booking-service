import { QueryInterface } from 'sequelize';

/*
 * The admin can mark a counselling call as done. completed_at records when they did it; the status itself uses the
 * 'completed' value the bookings.status enum already has since the table was created.
 *
 * Nothing to backfill: no booking has been marked done yet.
 */
export default {
    async up(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            ALTER TABLE bookings
                ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL AFTER cancelled_at;
        `);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // A call marked done must not be left with a status the older code does not know how to show.
        await queryInterface.sequelize.query(`
            UPDATE bookings SET status = 'confirmed' WHERE status = 'completed';
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE bookings DROP COLUMN completed_at;
        `);
    },
};
