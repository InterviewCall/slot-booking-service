import { CreationAttributes, Op, Transaction } from 'sequelize';

import Booking from '../db/models/Booking.model';
import DateTimeSlot from '../db/models/DateTimeSlot.model';
import { BookingCancelSource } from '../utils/enums/BookingCancelSource';
import { BookingStatus } from '../utils/enums/BookingStatus';
import { NotFoundError } from '../utils/errors/app.error';
import BaseRepository from './Base.repository';

class BookingRepository extends BaseRepository<Booking> {
    constructor() {
        super(Booking);
    }

    async create(data: CreationAttributes<Booking>, transaction?: Transaction): Promise<Booking> {
        return await this.model.create(data, { transaction });
    }

    async confirmBooking(id: bigint, transaction: Transaction): Promise<Booking> {
        const booking: Booking | null = await this.model.findByPk(id, { transaction });

        if(!booking) {
            throw new NotFoundError(`Booking with id: ${id} not found`);
        }

        booking.status = BookingStatus.CONFIRMED;
        booking.confirmedAt = new Date();
        const updatedBooking: Booking = await booking.save({ transaction });

        return updatedBooking;
    }

    // Same as findById but locks the row until the transaction ends, so two admins (or an admin and a cancel) cannot change the status at once.
    async findByIdForUpdate(id: bigint, transaction: Transaction): Promise<Booking | null> {
        return await this.model.findOne({
            where: { id, deletedAt: null },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
    }

    async markCompleted(booking: Booking, completedAt: Date, transaction: Transaction): Promise<Booking> {
        booking.status = BookingStatus.COMPLETED;
        booking.completedAt = completedAt;

        return await booking.save({ transaction });
    }

    async undoCompleted(booking: Booking, transaction: Transaction): Promise<Booking> {
        booking.status = BookingStatus.CONFIRMED;
        booking.completedAt = null;

        return await booking.save({ transaction });
    }

    async cancelBooking(booking: Booking, source: BookingCancelSource, transaction: Transaction): Promise<Booking> {
        booking.status = BookingStatus.CANCELLED;
        booking.cancelledAt = new Date();
        booking.cancelSource = source;
        const updatedBooking: Booking = await booking.save({ transaction });

        return updatedBooking;
    }

    async cancelBookings(bookingIds: bigint[], source: BookingCancelSource, transaction: Transaction) {
        const [affectedCount] = await this.model.update({
            status: BookingStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelSource: source
        }, {
            where: {
                id: {
                    [Op.in]: bookingIds
                }
            },
            transaction
        });

        return affectedCount;
    }

    /**
     * Every booking of the given submissions that counts as a booking, newest first.
     *
     * A cancelled booking that was never confirmed is a hold the candidate walked away from (or that timed out), not a
     * booking, so it is left out. A booking that WAS confirmed and later cancelled is kept: the admin must see it.
     *
     *   SELECT b.id, b.submission_id, b.status, b.created_at, b.confirmed_at, b.cancelled_at, b.completed_at, b.cancel_source,
     *          s.id, s.slot_start_at
     *   FROM bookings b
     *   JOIN date_time_slots s ON s.id = b.date_time_slot_id
     *   WHERE b.submission_id IN (?) AND b.deleted_at IS NULL
     *     AND NOT (b.status = 'cancelled' AND b.confirmed_at IS NULL)
     *   ORDER BY b.id DESC
     */
    async findCountedBookingsForSubmissions(submissionIds: string[]): Promise<Booking[]> {
        if (submissionIds.length === 0) {
            return [];
        }

        return await this.model.findAll({
            where: {
                submissionId: { [Op.in]: submissionIds },
                deletedAt: null,
                [Op.not]: { status: BookingStatus.CANCELLED, confirmedAt: null },
            },
            attributes: ['id', 'submissionId', 'status', 'createdAt', 'confirmedAt', 'cancelledAt', 'completedAt', 'cancelSource'],
            include: [
                {
                    model: DateTimeSlot,
                    as: 'dateTimeSlot',
                    attributes: ['id', 'slotStartAt'],
                    required: true,
                },
            ],
            order: [['id', 'DESC']],
        });
    }

    /**
     * Every booking whose slot starts inside [start, end), for the admin week view.
     *
     * Same rule as findCountedBookingsForSubmissions: a cancelled booking that was never confirmed is a hold that was
     * abandoned or timed out, not a booking. On top of that an unconfirmed hold (initiated) only counts while it is still
     * inside its hold time (created at or after holdsSince); older ones are about to be released by the cron.
     *
     *   SELECT b.*, s.id, s.slot_start_at
     *   FROM bookings b
     *   JOIN date_time_slots s ON s.id = b.date_time_slot_id AND s.slot_start_at >= ? AND s.slot_start_at < ? AND s.deleted_at IS NULL
     *   WHERE b.deleted_at IS NULL
     *     AND NOT (b.status = 'cancelled' AND b.confirmed_at IS NULL)
     *     AND NOT (b.status = 'initiated' AND b.created_at < ?)
     *   ORDER BY s.slot_start_at ASC, b.id ASC
     */
    async findCountedBookingsInRange(start: Date, end: Date, holdsSince: Date): Promise<Booking[]> {
        return await this.model.findAll({
            where: {
                deletedAt: null,
                [Op.and]: [
                    { [Op.not]: { status: BookingStatus.CANCELLED, confirmedAt: null } },
                    { [Op.not]: { status: BookingStatus.INITIATED, createdAt: { [Op.lt]: holdsSince } } },
                ],
            },
            attributes: ['id', 'submissionId', 'status', 'createdAt', 'confirmedAt', 'cancelledAt', 'completedAt', 'cancelSource'],
            include: [
                {
                    model: DateTimeSlot,
                    as: 'dateTimeSlot',
                    attributes: ['id', 'slotStartAt'],
                    where: { slotStartAt: { [Op.gte]: start, [Op.lt]: end }, deletedAt: null },
                    required: true,
                },
            ],
            order: [[{ model: DateTimeSlot, as: 'dateTimeSlot' }, 'slotStartAt', 'ASC'], ['id', 'ASC']],
        });
    }

    /**
     * Start of the earliest confirmed call after the given instant, on any date, or null.
     *
     *   SELECT s.slot_start_at FROM bookings b JOIN date_time_slots s ON s.id = b.date_time_slot_id
     *   WHERE b.status = 'confirmed' AND b.deleted_at IS NULL AND s.slot_start_at > ? AND s.deleted_at IS NULL
     *   ORDER BY s.slot_start_at ASC LIMIT 1
     */
    async findNextConfirmedCallAt(after: Date): Promise<Date | null> {
        const booking = await this.model.findOne({
            where: { status: BookingStatus.CONFIRMED, deletedAt: null },
            attributes: ['id'],
            include: [
                {
                    model: DateTimeSlot,
                    as: 'dateTimeSlot',
                    attributes: ['slotStartAt'],
                    where: { slotStartAt: { [Op.gt]: after }, deletedAt: null },
                    required: true,
                },
            ],
            order: [[{ model: DateTimeSlot, as: 'dateTimeSlot' }, 'slotStartAt', 'ASC']],
        });

        return booking?.dateTimeSlot?.slotStartAt ?? null;
    }

    async findCandidateIdWithStatus(bookingId: bigint) {
        const booking = await this.model.findByPk(bookingId, {
            attributes: ['status', 'candidateId']
        });

        return booking;
    }

    async getBooking(bookingId: bigint): Promise<Booking | null> {
        const booking = await this.model.findByPk(bookingId, {
            attributes: ['candidateId', 'submissionId', 'dateTimeSlotId', 'status'],
        });

        return booking;
    }
}

export default BookingRepository;