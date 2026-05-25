import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import DateTimeSlot from '../db/models/DateTimeSlot.model';
import { GetAvailableSlotsDto } from '../dtos/DateTimeSlot.dto';
import BookingDateRepository from '../repositories/BookingDate.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import DateTimeSlotService from '../services/DateTimeSlot.service';
import { buildSuccessResponse } from '../utils/helpers/response.helper';

const dateTimeSlotService = new DateTimeSlotService(new DateTimeSlotRepository(), new BookingDateRepository());

async function getAllAvailabilitySlotsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const slotAvailabilityForTheDate = req.query as unknown as GetAvailableSlotsDto;
        const availableSlots: DateTimeSlot[] = await dateTimeSlotService.getAllAvailableSlotsForGivenDate(slotAvailabilityForTheDate);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<DateTimeSlot[]>(
                availableSlots.length 
                    ? 'Available slots fetched successfully' 
                    : 'No slots available for this date, try another date',
                availableSlots
            )
        );
    } catch (error) {
        next(error);
    }
}

async function getSlotDetailsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const slotId = req.params.slotId;
        const response = await dateTimeSlotService.getSlotDetails(Number(slotId));
        res.status(StatusCodes.OK).json({
            data: response
        });
    } catch (error) {
        next(error);
    }
}

export default {
    getAllAvailabilitySlotsHandler,
    getSlotDetailsHandler
};