import { ExecutionError, Lock } from '@sesamecare-oss/redlock';
import { isAxiosError } from 'axios';
import { Transaction } from 'sequelize';

import { fetchFormSubmissionDetails } from '../apis/candidateFormDetailsService.api';
import logger from '../configs/logger.config';
import { redlock } from '../configs/redis.config';
import { serverConfig } from '../configs/server.config';
import Booking from '../db/models/Booking.model';
import DateTimeSlot from '../db/models/DateTimeSlot.model';
import IdempotencyKey from '../db/models/IdempotencyKey.model';
import sequelize from '../db/models/sequelize';
import { CreateBookingDto } from '../dtos/Booking.dto';
import BookingRepository from '../repositories/Booking.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import IdempotencyKeyRepository from '../repositories/IdempotencyKey.repository';
import { ApiErrorResponse, CreateBookingResponse, FormSubmissionDetailsResponse } from '../types/Response.type';
import { TimeSlotStatus } from '../utils/enums/TimeSlotStatus';
import { AppError, BadRequestError, ConflictError, InternalServerError, NotFoundError } from '../utils/errors/app.error';
import { createErrorExecutor } from '../utils/helpers/errorExecutorFactory';
import { getReservationExpiredTime } from '../utils/helpers/getReservationExpiredTime.helper';
import { checkIsValidUUID, generateIdempotencyKey } from '../utils/helpers/idempotencyKey.helper';
import { getOneReservationExpireTimeStamp } from '../utils/helpers/reservation.helper';

class BookingService {
    private readonly bookingRepositoty: BookingRepository;
    private readonly idempotencyKeyRepository: IdempotencyKeyRepository;
    private readonly dateTimeSlotRepository: DateTimeSlotRepository;

    constructor(
        bookingRepositoty: BookingRepository,
        idempotencyKeyRepository: IdempotencyKeyRepository,
        dateTimeSlotRepository: DateTimeSlotRepository
    ) {
        this.bookingRepositoty = bookingRepositoty;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.dateTimeSlotRepository = dateTimeSlotRepository;
    }

    async createBooking(bookingPayload: CreateBookingDto): Promise<CreateBookingResponse> {
        if(!checkIsValidUUID(bookingPayload.submissionId)) {
            throw new BadRequestError('Submission Id should be a valid UUID');
        }

        const bookingResource: string = `dateTimeSlot:${bookingPayload.dateTimeSlotId}`;
        const ttl: number = serverConfig.LOCK_TTL;

        const transaction: Transaction = await sequelize.transaction();
        let lock: Lock | undefined = undefined;
        try {
            lock = await redlock.acquire([bookingResource], ttl);

            const slot: DateTimeSlot | null = await this.dateTimeSlotRepository.findById(
                bookingPayload.dateTimeSlotId,
                transaction
            );

            if(!slot) {
                throw new NotFoundError('Slot is not found for this date');
            }

            const isSlotExpired = new Date(slot.slotStartAt).getTime() <= Date.now();

            if(isSlotExpired || slot.status != TimeSlotStatus.AVAILABLE) {
                throw new BadRequestError('This slot is not available to book, try with another slot');
            }

            const submissionDetails: FormSubmissionDetailsResponse = await fetchFormSubmissionDetails(bookingPayload.submissionId);

            const booking: Booking = await this.bookingRepositoty.create({
                dateTimeSlotId: bookingPayload.dateTimeSlotId,
                candidateId: submissionDetails.data.candidateId,
                submissionId: bookingPayload.submissionId
            }, transaction);

            await this.dateTimeSlotRepository.reserveSlot(
                slot,
                transaction
            );

            const idemKey = generateIdempotencyKey();

            const idempotencyKey = await this.idempotencyKeyRepository.create({
                idemKey,
                bookingId: booking.id
            }, transaction);

            await transaction.commit();

            return {
                candidateId: submissionDetails.data.candidateId,
                slotId: bookingPayload.dateTimeSlotId,
                reservationId: idemKey,
                expiredAt: getReservationExpiredTime(idempotencyKey.createdAt)
            };
        } catch (error) {
            await transaction.rollback();

            logger.error('The failing reason of create booking service method', { error });

            if(error instanceof ExecutionError) {
                throw new ConflictError('This slot is currently being reserved. Please try another slot');
            }

            if(isAxiosError<ApiErrorResponse>(error)) {
                if(lock) {
                    await lock.release();
                }

                const statusCode = error.response?.status;
                const message = error.response?.data.message;

                if(statusCode && message) {
                    const axiosError: AppError | null = createErrorExecutor(statusCode, message);
                    if(axiosError) {
                        throw axiosError;
                    }
                }
            }

            if(error instanceof NotFoundError || error instanceof BadRequestError) {
                if(lock) {
                    await lock.release();
                }
                throw error;
            }

            throw new InternalServerError('Something went wrong while reserving slot');
        }
    }

    async confirmBooking(reservationId: string) {
        if(!checkIsValidUUID(reservationId)) {
            throw new BadRequestError('Submission Id should be a valid UUID');
        }

        const transaction: Transaction = await sequelize.transaction();
        try {
            const idempotencyKey: IdempotencyKey | null = await this.idempotencyKeyRepository.findOneWithLock(
                reservationId,
                transaction
            );

            if(!idempotencyKey) {
                throw new NotFoundError('No reservation found with this resrvation id');
            }

            if(idempotencyKey.finalized) {
                throw new BadRequestError('This reservation is already confirmed');
            }

            const expireTimeStamp = getOneReservationExpireTimeStamp(idempotencyKey.createdAt);

            const isExpired: boolean = expireTimeStamp <= Date.now();

            if(isExpired) {
                throw new BadRequestError('This reservation has expired please select another slot');
            }

            const booking: Booking = await this.bookingRepositoty.confirmBooking(
                idempotencyKey.bookingId,
                transaction
            );

            await this.dateTimeSlotRepository.bookSlot(
                booking.dateTimeSlotId,
                transaction
            );

            await this.idempotencyKeyRepository.finalizeKey(
                idempotencyKey,
                transaction
            );

            await transaction.commit();

            return booking;
        } catch (error) {
            await transaction.rollback();

            logger.error('The reason of failing confirm booking method in booking service', { error });

            if(error instanceof NotFoundError || error instanceof BadRequestError) {
                throw error;
            }

            throw new InternalServerError('Something went wrong while confirming booking');
        }
    }
}

export default BookingService;