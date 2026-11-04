import { Op, Transaction } from 'sequelize';

import CrmOutbox from '../db/models/CrmOutbox.model';

class CrmOutboxRepository {
    /** Adds an event unless one with the same id exists. Returns whether a new row was written. */
    async enqueue(eventId: string, eventType: string, bookingId: bigint, transaction?: Transaction): Promise<boolean> {
        const now = new Date();
        const [row, created] = await CrmOutbox.findOrCreate({
            where: { eventId },
            defaults: { eventId, eventType, bookingId, nextAttemptAt: now },
            transaction
        });
        return created && Boolean(row);
    }

    async findDue(limit: number): Promise<CrmOutbox[]> {
        return await CrmOutbox.findAll({
            where: { status: 'PENDING', nextAttemptAt: { [Op.lte]: new Date() } },
            order: [['id', 'ASC']],
            limit
        });
    }

    /** Takes a row for sending by pushing its next attempt into the future. False when another process took it first. */
    async claim(id: number, leaseMs: number): Promise<boolean> {
        const [changed] = await CrmOutbox.update(
            { nextAttemptAt: new Date(Date.now() + leaseMs) },
            { where: { id, status: 'PENDING', nextAttemptAt: { [Op.lte]: new Date() } } }
        );
        return changed === 1;
    }

    async markSent(id: number): Promise<void> {
        await CrmOutbox.update({ status: 'SENT', sentAt: new Date(), lastError: null }, { where: { id } });
    }

    /** Nothing to send any more (e.g. the call was reopened before the message went out). Closed, with the reason kept. */
    async markSkipped(id: number, attempts: number, reason: string): Promise<void> {
        await CrmOutbox.update({ status: 'SENT', attempts, lastError: `Skipped: ${reason}`.slice(0, 500) }, { where: { id } });
    }

    async markRetry(id: number, attempts: number, nextAttemptAt: Date, error: string): Promise<void> {
        await CrmOutbox.update({ attempts, nextAttemptAt, lastError: error.slice(0, 500) }, { where: { id } });
    }

    async markFailed(id: number, attempts: number, error: string): Promise<void> {
        await CrmOutbox.update({ status: 'FAILED', attempts, lastError: error.slice(0, 500) }, { where: { id } });
    }
}

export default CrmOutboxRepository;
