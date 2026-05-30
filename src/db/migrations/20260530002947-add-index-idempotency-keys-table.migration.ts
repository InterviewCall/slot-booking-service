import { QueryInterface } from 'sequelize';

export default {
    async up (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            CREATE INDEX idx_idempotency_keys_finalized_created_at
            ON idempotency_keys (finalized, created_at);
        `);
    },

    async down (queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DROP INDEX idx_idempotency_keys_finalized_created_at
            ON idempotency_keys;
        `);
    }
};