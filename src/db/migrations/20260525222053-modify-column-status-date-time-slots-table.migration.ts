import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            ALTER TABLE date_time_slots
            MODIFY COLUMN status
            ENUM('available', 'blocked', 'booked', 'reserved')
            NOT NULL DEFAULT 'available';
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            ALTER TABLE date_time_slots
            MODIFY COLUMN status
            ENUM('available', 'blocked', 'booked')
            NOT NULL DEFAULT 'available';
        `);
    }
};
