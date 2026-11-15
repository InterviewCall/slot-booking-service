import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import BookingRepository from '../repositories/Booking.repository';
import BookingLookupService from '../services/BookingLookup.service';
import { BookingLookupResponse } from '../types/BookingLookup.type';
import { buildSuccessResponse } from '../utils/helpers/response.helper';
import { lookupBookingsBodySchema } from '../validators/booking.validator';

const bookingLookupService = new BookingLookupService(new BookingRepository());

async function lookupBookingsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { submissionIds } = lookupBookingsBodySchema.parse(req.body);
        const response = await bookingLookupService.lookupBySubmissionIds(submissionIds);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<BookingLookupResponse>('Bookings fetched successfully', response)
        );
    } catch (error) {
        next(error);
    }
}

export default {
    lookupBookingsHandler,
};
