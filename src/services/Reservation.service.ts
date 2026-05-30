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
import { ApiErrorResponse, ReservationReviewResponse, UpdateCountResponse } from '../types/Response.type';
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
import { getOneReservationExpireTimeStamp, getReservationExpireTimeStamp } from '../utils/helpers/reservation.helper';

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

            const expireTimeStamp = getOneReservationExpireTimeStamp(reservationDetails.createdAt);

            const isReservationExpired: boolean = expireTimeStamp <= Date.now();

            if(!reservationDetails.finalized && isReservationExpired) {
                throw new GoneError('This reservation has expired, please select another slot');
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
                candidatePhone: candidateDetails.data.phone,
                slotDetails,
                expiresAt: new Date(expireTimeStamp),
                reservationStatus: isConfirmed
                    ? 'confirmed'
                    : 'pending_confirmation',
            };
        } catch (error) {
            console.log(error);
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

    async releaseExpiredSlotReservations(): Promise<UpdateCountResponse> {
        const transaction: Transaction = await sequelize.transaction();
        try {
            const updatedCount: UpdateCountResponse = {
                totalReleasedCount: 0,
                updatedBookingCount: 0,
                updatedDateTimeSlotCount: 0
            };

            const timestamp = getReservationExpireTimeStamp();

            const reservations = await this.idempotencyKeyRepository.findAllSlotsIdsWhereReservationExpires(
                timestamp,
                transaction
            );

            if(reservations.length == 0) {
                await transaction.commit();
                return updatedCount;
            }

            const bookingIds: number[] = [];
            const slotIds: number[] = [];

            for(const reservation of reservations) {
                if(!reservation.booking) {
                    throw new NotFoundError(`Booking association missing for expired reservation id: ${reservation.idemKey}`);
                }

                bookingIds.push(reservation.booking.id);
                slotIds.push(reservation.booking.dateTimeSlotId);
            }

            if(bookingIds.length == 0 || slotIds.length == 0) {
                await transaction.commit();
                return updatedCount;
            }

            updatedCount.updatedBookingCount = await this.bookingRepository.cancelBookings(
                bookingIds,
                transaction
            );

            updatedCount.updatedDateTimeSlotCount = await this.dateTimeSlotRepository.availableSlots(
                slotIds,
                transaction
            );

            updatedCount.totalReleasedCount = updatedCount.updatedBookingCount + updatedCount.updatedDateTimeSlotCount;

            await transaction.commit();

            return updatedCount;

        } catch (error) {
            await transaction.rollback();

            logger.error('The reason of failing release expired slot reservation method in reservation service', { error });

            if(error instanceof NotFoundError) {
                throw error;
            }

            throw new InternalServerError('Something went wrong while relesing slots');
        }
    }
}

export default ReservationService;