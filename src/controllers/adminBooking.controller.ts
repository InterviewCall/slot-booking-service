import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import BookingRepository from '../repositories/Booking.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import AdminBookingCompletionService from '../services/AdminBookingCompletion.service';
import AdminBookingWeekService from '../services/AdminBookingWeek.service';
import { AdminBookingCompletionResponse, AdminBookingsWeekResponse } from '../types/AdminBooking.type';
import { buildSuccessResponse } from '../utils/helpers/response.helper';
import { adminBookingParamsSchema, adminBookingsWeekQuerySchema } from '../validators/adminBooking.validator';

const adminBookingWeekService = new AdminBookingWeekService(new BookingRepository(), new DateTimeSlotRepository());
const adminBookingCompletionService = new AdminBookingCompletionService(new BookingRepository(), new DateTimeSlotRepository());

async function getBookingsWeekHandler(req: Request, res: Response, next: NextFunction) {
    try {
        // The validator middleware checks the query but does not replace req.query, so parse again.
        const { weekStart } = adminBookingsWeekQuerySchema.parse(req.query);
        const response = await adminBookingWeekService.getWeek(weekStart);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<AdminBookingsWeekResponse>('Bookings fetched successfully', response)
        );
    } catch (error) {
        next(error);
    }
}

async function completeBookingHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { bookingId } = adminBookingParamsSchema.parse(req.params);
        const response = await adminBookingCompletionService.complete(bookingId);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<AdminBookingCompletionResponse>('Call marked as done', response)
        );
    } catch (error) {
        next(error);
    }
}

async function undoCompleteBookingHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { bookingId } = adminBookingParamsSchema.parse(req.params);
        const response = await adminBookingCompletionService.undoComplete(bookingId);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<AdminBookingCompletionResponse>('Call reopened', response)
        );
    } catch (error) {
        next(error);
    }
}

export default {
    getBookingsWeekHandler,
    completeBookingHandler,
    undoCompleteBookingHandler,
};
