import { Transaction } from 'sequelize';

import logger from '../configs/logger.config';
import Booking from '../db/models/Booking.model';
import sequelize from '../db/models/sequelize';
import BookingRepository from '../repositories/Booking.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import { AdminBookingCompletionResponse } from '../types/AdminBooking.type';
import { BookingStatus } from '../utils/enums/BookingStatus';
import { AppError, ConflictError, InternalServerError, NotFoundError } from '../utils/errors/app.error';

/**
 * The admin marks a counselling call as done (and can take that back).
 *
 * confirmed --complete--> completed --undo--> confirmed
 *
 * Both directions are idempotent: asking for the state the booking is already in is a success, so a double click or a
 * retry after a lost response does not turn into an error. Any other starting state is a 409.
 */
class AdminBookingCompletionService {
    constructor(
        private readonly bookingRepository: BookingRepository,
        private readonly dateTimeSlotRepository: DateTimeSlotRepository
    ) {}

    async complete(bookingId: bigint, now: Date = new Date()): Promise<AdminBookingCompletionResponse> {
        return await this.inTransaction(async (transaction) => {
            const booking = await this.lockBooking(bookingId, transaction);

            if (booking.status === BookingStatus.COMPLETED) {
                return this.toResponse(booking);
            }

            if (booking.status !== BookingStatus.CONFIRMED) {
                throw new ConflictError(`Only a confirmed booking can be marked as done. This booking is ${booking.status}.`);
            }

            const slot = await this.dateTimeSlotRepository.findById(booking.dateTimeSlotId, transaction);

            if (!slot) {
                throw new NotFoundError('The slot of this booking could not be found');
            }

            if (new Date(slot.slotStartAt).getTime() > now.getTime()) {
                throw new ConflictError('This call has not started yet, so it cannot be marked as done.');
            }

            // The column keeps whole seconds; store the same value we answer with so a retry returns an identical completedAt.
            const completedAt = new Date(Math.floor(now.getTime() / 1000) * 1000);

            return this.toResponse(await this.bookingRepository.markCompleted(booking, completedAt, transaction));
        });
    }

    async undoComplete(bookingId: bigint): Promise<AdminBookingCompletionResponse> {
        return await this.inTransaction(async (transaction) => {
            const booking = await this.lockBooking(bookingId, transaction);

            if (booking.status === BookingStatus.CONFIRMED) {
                return this.toResponse(booking);
            }

            if (booking.status !== BookingStatus.COMPLETED) {
                throw new ConflictError(`Only a booking marked as done can be reopened. This booking is ${booking.status}.`);
            }

            return this.toResponse(await this.bookingRepository.undoCompleted(booking, transaction));
        });
    }

    private async lockBooking(bookingId: bigint, transaction: Transaction): Promise<Booking> {
        const booking = await this.bookingRepository.findByIdForUpdate(bookingId, transaction);

        if (!booking) {
            throw new NotFoundError(`No booking found with this id: ${bookingId}`);
        }

        return booking;
    }

    private toResponse(booking: Booking): AdminBookingCompletionResponse {
        return {
            bookingId: String(booking.id),
            status: booking.status,
            completedAt: booking.completedAt ? booking.completedAt.toISOString() : null,
        };
    }

    private async inTransaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
        const transaction = await sequelize.transaction();

        try {
            const result = await work(transaction);
            await transaction.commit();
            return result;
        } catch (error) {
            await transaction.rollback();

            // Expected refusals (404 / 409) go straight back to the admin; anything else is a real failure.
            if (error instanceof Object && 'statusCode' in error) {
                throw error as AppError;
            }

            logger.error('Marking a booking as done failed', { error });
            throw new InternalServerError('Something went wrong while updating the booking');
        }
    }
}

export default AdminBookingCompletionService;
