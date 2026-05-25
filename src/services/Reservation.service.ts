import axios from 'axios';
import { Transaction } from 'sequelize';

import { fetchCandidateDetails } from '../apis/candidateFormDetailsService.api';
import logger from '../configs/logger.config';
import Booking from '../db/models/Booking.model';
import DateTimeSlot from '../db/models/DateTimeSlot.model';
import sequelize from '../db/models/sequelize';
import BookingRepository from '../repositories/Booking.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import IdempotencyKeyRepository from '../repositories/IdempotencyKey.repository';
import { ApiErrorResponse, ReservationReviewResponse } from '../types/Response.type';
import { BookingStatus } from '../utils/enums/BookingStatus';
import { TimeSlotStatus } from '../utils/enums/TimeSlotStatus';
import {
    AppError,
    BadRequestError,
    GoneError,
    InternalServerError,
    NotFoundError
} from '../utils/errors/app.error';
import { createErrorExecutor } from '../utils/helpers/errorExecutorFactory';
import { formatBookingDate } from '../utils/helpers/formatBookingDate';
import { getReservationExpiredTime } from '../utils/helpers/getReservationExpiredTime.helper';
import { checkIsValidUUID } from '../utils/helpers/idempotencyKey.helper';

class ReservationService {
    private readonly idempotencyKeyRepository: IdempotencyKeyRepository;
    private readonly bookingRepository: BookingRepository;
    private readonly dateTimeSlotRepository: DateTimeSlotRepository;

    constructor(
        idempotencyKeyRepository: IdempotencyKeyRepository,
        bookingRepository: BookingRepository,
        dateTimeSlotRepository: DateTimeSlotRepository
    ) {
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.bookingRepository = bookingRepository;
        this.dateTimeSlotRepository = dateTimeSlotRepository;
    }

    async getReservationDetails(reservationId: string): Promise<ReservationReviewResponse> {
        if (!checkIsValidUUID(reservationId)) {
            throw new BadRequestError('Reservation ID must be a valid UUID');
        }

        try {
            const reservationDetails = await this.idempotencyKeyRepository.findOneWithAttributes(reservationId);

            if (!reservationDetails) {
                throw new NotFoundError('No reservation found with the given reservation ID');
            }

            const expirationTime = getReservationExpiredTime(reservationDetails.createdAt);

            if(!reservationDetails.finalized && this.isExpired(expirationTime)) {
                throw new GoneError('This reservation has expired. Please select another slot');
            }

            const booking: Booking | null = await this.bookingRepository.findById(reservationDetails.bookingId);

            if (!booking) {
                throw new NotFoundError('No booking found against this reservation ID');
            }

            const slot: DateTimeSlot | null = await this.dateTimeSlotRepository.getSlotDetails(booking.dateTimeSlotId);

            if (!slot?.bookingDate || !slot.timeSlot) {
                throw new NotFoundError('No slot details found for this reservation');
            }

            const isConfirmed =
            reservationDetails.finalized &&
            booking.status === BookingStatus.CONFIRMED &&
            slot.status === TimeSlotStatus.BOOKED;

            if (!isConfirmed) {
                if (booking.status !== BookingStatus.INITIATED) {
                    throw new BadRequestError('This booking is no longer pending confirmation');
                }

                if (slot.status !== TimeSlotStatus.RESERVED) {
                    throw new BadRequestError('This reserved slot is no longer available for confirmation');
                }
            }

            const candidateDetails = await fetchCandidateDetails(booking.candidateId);

            const slotDetails = `${formatBookingDate(slot.bookingDate.bookingDate)}, ${slot.timeSlot.slotLabel}`;

            return {
                candidateName: candidateDetails.data.fullName,
                candidateEmail: candidateDetails.data.email,
                slotDetails,
                expiresAt: expirationTime,
                reservationStatus: isConfirmed
                    ? 'confirmed'
                    : 'pending_confirmation',
            };
        } catch (error) {
            logger.error('The failing reason of get resrvation details reservation service method', { error });

            if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof GoneError) {
                throw error;
            }

            if (axios.isAxiosError<ApiErrorResponse>(error)) {
                const statusCode = error.response?.status;
                const message = error.response?.data.message;
                
                if(statusCode && message) {
                    const axiosError: AppError | null = createErrorExecutor(statusCode, message);
                    if(axiosError) {
                        throw axiosError;
                    }
                }
            }

            throw new InternalServerError('Something went wrong while fetching reservation details');
        }
    }

    async cancelReservation(reservationId: string) {
        if(!checkIsValidUUID(reservationId)) {
            throw new BadRequestError('Reservation ID must be a valid UUID');
        }

        const transaction: Transaction = await sequelize.transaction();
        try {
            const reservationDetails = await this.idempotencyKeyRepository.findOne({ idemKey: reservationId });

            if(!reservationDetails) {
                throw new NotFoundError('No reservation found with the given reservation ID'); 
            }

            if(reservationDetails.finalized) {
                throw new BadRequestError('This reservation has already been finalized');
            }

            const reservationExpirationTime: string = getReservationExpiredTime(reservationDetails.createdAt);

            const isExpired = new Date(reservationExpirationTime).getTime() <= Date.now();

            if(isExpired) {
                throw new BadRequestError('This reservation is already expired, can not cancel now');
            }

            const booking: Booking | null = await this.bookingRepository.findById(reservationDetails.bookingId);

            if(!booking) {
                throw new NotFoundError(`No booking found with this reservation: ${reservationDetails.bookingId}`);
            }

            await this.idempotencyKeyRepository.softDelete(
                reservationDetails,
                transaction
            );

            await this.bookingRepository.cancelBooking(
                booking,
                transaction
            );

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();

            logger.error('The reason fo failing cancel reservation method in reservation service', { error });

            if(error instanceof NotFoundError) {
                throw error;
            }

            throw new InternalServerError('Something went wrong while cancelling a reservation');
        }
    }

    private isExpired(expirationTime: string | Date): boolean {
        const expirationTimestamp = new Date(expirationTime).getTime();
        
        if(Number.isNaN(expirationTimestamp)) {
            throw new BadRequestError('Reservation expiry time is invalid');
        }

        return expirationTimestamp <= Date.now();
    }
}

export default ReservationService;