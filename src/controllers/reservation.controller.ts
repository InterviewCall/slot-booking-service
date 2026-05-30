import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ReservationParamsDto } from '../dtos/Resrvation.dto';
import BookingRepository from '../repositories/Booking.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import IdempotencyKeyRepository from '../repositories/IdempotencyKey.repository';
import ReservationService from '../services/Reservation.service';
import { ReservationReviewResponse } from '../types/Response.type';
import { buildSuccessResponse } from '../utils/helpers/response.helper';

const reservationService = new ReservationService(new IdempotencyKeyRepository(), new BookingRepository(), new DateTimeSlotRepository());

async function getReservationDetailsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { reservationId } = req.params as unknown as ReservationParamsDto;
        const response = await reservationService.getReservationDetails(reservationId);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<ReservationReviewResponse>('Reservation details fetched successfully', response)
        );
    } catch (error) {
        next(error);
    }
}

async function cancelReservationHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { reservationId } = req.params as unknown as ReservationParamsDto;
        const response = await reservationService.cancelReservation(reservationId);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<void>('Your reservation got cancelled', response)
        );
    } catch (error) {
        next(error);
    }
}

async function releaseExpiredSlotReservationsHandler(_req: Request, res: Response, next: NextFunction) {
    try {
        const response = await reservationService.releaseExpiredSlotReservations();
        res.status(StatusCodes.OK).json(
            { data: response }
        );
    } catch (error) {
        next(error);
    }
}

export default {
    getReservationDetailsHandler,
    cancelReservationHandler,
    releaseExpiredSlotReservationsHandler
};