import { CreationAttributes, Op, Transaction } from 'sequelize';

import Booking from '../db/models/Booking.model';
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
        const updatedBooking: Booking = await booking.save({ transaction });

        return updatedBooking;
    }

    async cancelBooking(booking: Booking, transaction: Transaction): Promise<Booking> {
        booking.status = BookingStatus.CANCELLED;
        const updatedBooking: Booking = await booking.save({ transaction });

        return updatedBooking;
    }

    async cancelBookings(bookingIds: bigint[], transaction: Transaction) {
        const [affectedCount] = await this.model.update({
            status: BookingStatus.CANCELLED
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