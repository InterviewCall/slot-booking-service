import { CreationAttributes, Op, Transaction } from 'sequelize';

import Booking from '../db/models/Booking.model';
import IdempotencyKey from '../db/models/IdempotencyKey.model';
import { BookingStatus } from '../utils/enums/BookingStatus';
import BaseRepository from './Base.repository';

class IdempotencyKeyRepository extends BaseRepository<IdempotencyKey> {
    constructor() {
        super(IdempotencyKey);
    }

    async create(data: CreationAttributes<IdempotencyKey>, transaction?: Transaction): Promise<IdempotencyKey> {
        return await this.model.create(data, { transaction });
    }

    async findOneWithAttributes(idemKey: string): Promise<IdempotencyKey | null> {
        const idempotencyKey = await this.model.findOne({
            where: {
                idemKey
            },
            attributes: ['bookingId', 'finalized', 'createdAt', 'expiresAt']
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

    async findAllSlotsIdsWhereReservationExpires(expiringTimestamp: Date, transaction: Transaction): Promise<IdempotencyKey[]> {
        const reservation = await this.model.findAll({
            where: {
                finalized: false,
                createdAt: {
                    [Op.lt]: expiringTimestamp
                },
            },
            attributes: ['idemKey'],
            include: [{
                model: Booking,
                as: 'booking',
                where: {
                    status: BookingStatus.INITIATED
                },
                attributes: ['id', 'dateTimeSlotId'],
                required: true
            }],
            order: [['createdAt', 'ASC']],
            limit: 100,
            transaction
        });

        return reservation;
    }
}

export default IdempotencyKeyRepository;