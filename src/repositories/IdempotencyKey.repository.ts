import { CreationAttributes, Transaction } from 'sequelize';

import IdempotencyKey from '../db/models/IdempotencyKey.model';
import BaseRepository from './Base.repository';

class IdempotencyKeyRepository extends BaseRepository<IdempotencyKey> {
    constructor() {
        super(IdempotencyKey);
    }

    async create(data: CreationAttributes<IdempotencyKey>, transaction?: Transaction): Promise<IdempotencyKey> {
        return await this.model.create(data, { transaction });
    }

    async findOneWithAttributes(idemKey: string) {
        const idempotencyKey = await this.model.findOne({
            where: {
                idemKey
            },
            attributes: ['bookingId', 'finalized', 'createdAt']
        });

        return idempotencyKey;
    }

    async findOneWithLock(idemKey: string, transaction: Transaction): Promise<IdempotencyKey | null> {
        const idempotencyKey: IdempotencyKey | null = await this.model.findOne({
            where: {
                idemKey
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        return idempotencyKey;
    }

    async finalizeKey(idempotencyKey: IdempotencyKey, transaction: Transaction): Promise<void> {
        idempotencyKey.finalized = true;
        await idempotencyKey.save({ transaction });
    }

    async softDelete(idempotencyKey: IdempotencyKey, transaction: Transaction) {
        idempotencyKey.deletedAt = new Date();
        await idempotencyKey.save({ transaction });
    }
}

export default IdempotencyKeyRepository;