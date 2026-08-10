import { isAxiosError } from 'axios';
import { Lock, LockAcquisitionError, LockHandle } from 'redlock-universal';
import { Transaction } from 'sequelize';

import { fetchCandidateDetails, fetchFormSubmissionDetails } from '../apis/candidateFormDetailsService.api';
import logger from '../configs/logger.config';
import { createDistributedLock } from '../configs/redis.config';
import { serverConfig } from '../configs/server.config';
import Booking from '../db/models/Booking.model';
import DateTimeSlot from '../db/models/DateTimeSlot.model';
import IdempotencyKey from '../db/models/IdempotencyKey.model';
import sequelize from '../db/models/sequelize';
import { CreateBookingDto } from '../dtos/Booking.dto';
import { addConfirmationDetailsToQueue } from '../producers/transactionalNottification.producer';
import BookingRepository from '../repositories/Booking.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import IdempotencyKeyRepository from '../repositories/IdempotencyKey.repository';
import { ApiErrorResponse, BookingDetailsResponse, CandidateData, CandidateDetailsResponse, ConfirmBookingResponse, CreateBookingResponse, EnqueuedResponse, FormSubmissionDetailsResponse } from '../types/Response.type';
import { BookingStatus } from '../utils/enums/BookingStatus';
import { NotificationChannel } from '../utils/enums/NotificationChannel.enum';
import { TimeSlotStatus } from '../utils/enums/TimeSlotStatus';
import { AppError, BadRequestError, ConflictError, InternalServerError, NotFoundError } from '../utils/errors/app.error';
import { createErrorExecutor } from '../utils/helpers/errorExecutorFactory';
import { formatBookingDate } from '../utils/helpers/formatBookingDate';
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

        const lock: Lock = createDistributedLock(bookingResource, ttl);
        let lockHandle: LockHandle | undefined = undefined;

        const transaction: Transaction = await sequelize.transaction();
        try {
            lockHandle = await lock.acquire();

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

            if(error instanceof LockAcquisitionError) {
                throw new ConflictError('This slot is currently being reserved. Please try another slot');
            }

            if(isAxiosError<ApiErrorResponse>(error)) {
                if(lockHandle) {
                    await lock.release(lockHandle);
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
                if(lockHandle) {
                    await lock.release(lockHandle);
                }
                throw error;
            }

            throw new InternalServerError('Something went wrong while reserving slot');
        }
    }

    async confirmBooking(reservationId: string): Promise<ConfirmBookingResponse> {
        if(!checkIsValidUUID(reservationId)) {
            throw new BadRequestError('Submission Id should be a valid UUID');
        }

        let booking: Booking | null = null;

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

            booking = await this.bookingRepositoty.confirmBooking(
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
        } catch (error) {
            await transaction.rollback();

            logger.error('The reason of failing confirm booking method in booking service', { error });

            if(error instanceof NotFoundError || error instanceof BadRequestError) {
                throw error;
            }

            throw new InternalServerError('Something went wrong while confirming booking');
        }

        const enqueuedResponse = await this.enqueueBookingConfirmationNotification(booking);

        return {
            bookingId: booking.id,
            enqueuedResponse
        };
    }

    async getBookingDetails(bookingId: bigint): Promise<BookingDetailsResponse> {
        try {
            const booking: Booking | null = await this.bookingRepositoty.getBooking(bookingId);

            if(!booking) {
                throw new NotFoundError(`No booking found with this id: ${bookingId}`);
            }

            if(booking.status != BookingStatus.CONFIRMED) {
                throw new BadRequestError('Booking is not in confirm state, can not find details');
            }

            const slot: DateTimeSlot | null = await this.dateTimeSlotRepository.getSlotDetails(booking.dateTimeSlotId);

            if(!slot) {
                throw new NotFoundError(`No time slot found with this slot id: ${booking.dateTimeSlotId}`);
            }

            if(!slot.bookingDate || !slot.timeSlot) {
                throw new NotFoundError('Slot detalils could not found');
            } 

            const candidate: CandidateDetailsResponse = await fetchCandidateDetails(booking.candidateId);

            const slotDetails: string = `${formatBookingDate(slot.bookingDate.bookingDate)}, ${slot.timeSlot.slotLabel}`;

            return {
                candidateName: candidate.data.fullName,
                candidateEmail: candidate.data.email,
                candidatePhone: candidate.data.phone,
                slotDetails
            };
        } catch (error) {
            logger.error('The failing reason of get booking details in booking service method', { error });

            if (error instanceof NotFoundError || error instanceof BadRequestError) {
                throw error;
            }

            if (isAxiosError<ApiErrorResponse>(error)) {
                const statusCode = error.response?.status;
                const message = error.response?.data.message;
                
                if(statusCode && message) {
                    const axiosError: AppError | null = createErrorExecutor(statusCode, message);
                    if(axiosError) {
                        throw axiosError;
                    }
                }
            }

            throw new InternalServerError('Something went wrong while fetching booking details');
        }
    }

    private async enqueueBookingConfirmationNotification(booking: Booking): Promise<EnqueuedResponse> {
        let failedReason: string = '';

        try {
            const candidateResponse: CandidateDetailsResponse = await fetchCandidateDetails(booking.candidateId);

            const candidate: CandidateData = candidateResponse.data;

            const slotDetails: DateTimeSlot | null = await this.dateTimeSlotRepository.getSlotDetails(booking.dateTimeSlotId);

            if (!slotDetails?.bookingDate || !slotDetails.timeSlot) {
                failedReason = 'Booking confirmed but not able To send notification due to slot details not found';
                return { failedReason };
            }

            await addConfirmationDetailsToQueue({
                bookingId: booking.id,
                submissionId: booking.submissionId,
                candidateId: candidate.id,
                candidateName: candidate.fullName,
                candidateEmail: candidate.email,
                candidatePhone: `+91${candidate.phone}`,
                slotDate: formatBookingDate(slotDetails.bookingDate.bookingDate),
                slotTime: slotDetails.timeSlot.slotLabel,
                subject: 'Booking Confirmed',
                templateKeys: {
                    EMAIL: 'BookingConfirmation',
                    WHATSAPP: 'BookingConfirmation'
                },
                channels: [
                    NotificationChannel.EMAIL,
                    NotificationChannel.WHATSAPP
                ]
            }); 
        } catch (error) {
            if(isAxiosError<ApiErrorResponse>(error)) {
                const statusCode: number | undefined = error.response?.status;
                const message: string | undefined = error.response?.data.message;

                const errorMessage: string = 'Booking Confirmed but not able To send notification due to ' + message;

                if(statusCode && message) {
                    failedReason = errorMessage;
                    return { failedReason };
                }
            }

            if(error instanceof Error) {
                logger.error('Booking confirmed but failed to enqueue notification job', {
                    bookingId: booking.id,
                    candidateId: booking.candidateId,
                    failedReason,
                    error,
                });

                failedReason = 'Booking confirmed but failed to enqueue notification job';
                return { failedReason };
            }
        }
    }
}

export default BookingService;