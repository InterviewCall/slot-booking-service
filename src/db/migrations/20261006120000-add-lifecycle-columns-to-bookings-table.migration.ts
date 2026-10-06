import { QueryInterface } from 'sequelize';

/*
 * A booking used to say only "initiated / confirmed / cancelled". These columns record WHEN it was confirmed or
 * cancelled and WHO cancelled it, so the admin panel can tell a real cancelled booking from a hold that was simply
 * abandoned or timed out.
 *
 * Existing rows are filled in from updated_at, which is the time of their last status change.
 * cancel_source stays NULL for rows cancelled before this migration: nothing recorded who did it.
 */
export default {
    async up(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            ALTER TABLE bookings
                ADD COLUMN confirmed_at TIMESTAMP NULL DEFAULT NULL AFTER status,
                ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL AFTER confirmed_at,
                ADD COLUMN cancel_source ENUM('candidate', 'system_expiry', 'admin') NULL DEFAULT NULL AFTER cancelled_at;
        `);

        await queryInterface.sequelize.query(`
            UPDATE bookings SET confirmed_at = updated_at WHERE status = 'confirmed' AND confirmed_at IS NULL;
        `);

        await queryInterface.sequelize.query(`
            UPDATE bookings SET cancelled_at = updated_at WHERE status = 'cancelled' AND cancelled_at IS NULL;
        `);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            ALTER TABLE bookings
                DROP COLUMN cancel_source,
                DROP COLUMN cancelled_at,
                DROP COLUMN confirmed_at;
        `);
    },
};
