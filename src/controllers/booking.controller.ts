import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import Booking from '../db/models/Booking.model';
import { ConfirmBookingDto, CreateBookingDto } from '../dtos/Booking.dto';
import BookingRepository from '../repositories/Booking.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import IdempotencyKeyRepository from '../repositories/IdempotencyKey.repository';
import BookingService from '../services/Booking.service';
import { CreateBookingResponse } from '../types/Response.type';
import { buildSuccessResponse } from '../utils/helpers/response.helper';

const bookingService = new BookingService(new BookingRepository(), new IdempotencyKeyRepository(), new DateTimeSlotRepository());

async function createBookingHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const bookingPayload = req.body as CreateBookingDto;
        const response: CreateBookingResponse = await bookingService.createBooking(bookingPayload);
        res.status(StatusCodes.CREATED).json(
            buildSuccessResponse<CreateBookingResponse>(
                'Your Booking is initiated please confirm it.',
                response
            )
        );
    } catch (error) {
        next(error);
    }
}

async function confirmBookingHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { reservationId } = req.query as unknown as ConfirmBookingDto;
        const response: Booking = await bookingService.confirmBooking(reservationId);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<Booking>('You booking is confirmed', response)
        );
    } catch (error) {
        next(error);
    }
}

export default {
    createBookingHandler,
    confirmBookingHandler
};