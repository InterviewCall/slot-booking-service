import { Op } from 'sequelize';

import BookingTimeSlot from '../db/models/BookingTimeSlot.model';
import DateTimeSlot from '../db/models/DateTimeSlot.model';
import { TimeSlotStatus } from '../utils/enums/TimeSlotStatus';
import BaseRepository from './Base.repository';

class DateTimeSlotRepository extends BaseRepository<DateTimeSlot> {
    constructor() {
        super(DateTimeSlot);
    }

    async getAvailableSlotForGivenDate(bookingDateId: number, bookingCutoffTime: string): Promise<DateTimeSlot[]> {
        const availableSlots: DateTimeSlot[] = await this.model.findAll({
            where: {
                bookingDateId,
                status: TimeSlotStatus.AVAILABLE,
                slotStartAt: {
                    [Op.gt]: bookingCutoffTime
                }
            },
            attributes: ['id', 'slotStartAt', 'status'],
            include: [
                {
                    model: BookingTimeSlot,
                    as: 'timeSlot',
                    attributes: ['id', 'slotTime', 'slotLabel'],
                    where: {
                        isActive: true
                    },
                    required: true
                }
            ],
            order: [
                [{ model: BookingTimeSlot, as: 'timeSlot' }, 'sortOrder', 'ASC']
            ]
        });

        return availableSlots;
    }
}

export default DateTimeSlotRepository;