import logger from '../configs/logger.config';
import BookingDate from '../db/models/BookingDate.model';
import DateTimeSlot from '../db/models/DateTimeSlot.model';
import { GetAvailableSlotsDto } from '../dtos/DateTimeSlot.dto';
import BookingDateRepository from '../repositories/BookingDate.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import { InternalServerError, NotFoundError } from '../utils/errors/app.error';
import { getBookingCutoffTime } from '../utils/helpers/slotAvailability.helper';

class DateTimeSlotService {
    private readonly dateTimeSlotRepository: DateTimeSlotRepository;
    private readonly bookingDateRepository: BookingDateRepository;

    constructor(dateTimeSlotRepository: DateTimeSlotRepository, bookingDateRepository: BookingDateRepository) {
        this.dateTimeSlotRepository = dateTimeSlotRepository;
        this.bookingDateRepository = bookingDateRepository;
    }

    async getAllAvailableSlotsForGivenDate(payload: GetAvailableSlotsDto): Promise<DateTimeSlot[]> {
        try {
            const bookingDate: BookingDate | null = await this.bookingDateRepository.findOne({
                bookingDate: payload.bookingDate
            });
            
            if(!bookingDate) {
                throw new NotFoundError('This date is not available to book');
            }
            
            const bookingCutoffTime: string = getBookingCutoffTime();

            const availableSlots: DateTimeSlot[] = await this.dateTimeSlotRepository.getAvailableSlotForGivenDate(
                bookingDate.id,
                bookingCutoffTime
            );

            return availableSlots;
        } catch (error) {
            logger.error(error);

            if(error instanceof NotFoundError) {
                throw error;
            }

            throw new InternalServerError('Something went wong, try again');
        }
    }

    async getSlotDetails(slotId: number) {
        const details = await this.dateTimeSlotRepository.getSlotDetails(slotId);
        return details;
    }
}

export default DateTimeSlotService;