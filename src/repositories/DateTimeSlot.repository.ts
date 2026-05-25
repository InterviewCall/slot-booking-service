import { Op, Transaction } from 'sequelize';

import BookingDate from '../db/models/BookingDate.model';
import BookingTimeSlot from '../db/models/BookingTimeSlot.model';
import DateTimeSlot from '../db/models/DateTimeSlot.model';
import { TimeSlotStatus } from '../utils/enums/TimeSlotStatus';
import { NotFoundError } from '../utils/errors/app.error';
import BaseRepository from './Base.repository';

class DateTimeSlotRepository extends BaseRepository<DateTimeSlot> {
    constructor() {
        super(DateTimeSlot);
    }

    async findById(id: number | string, transaction?: Transaction): Promise<DateTimeSlot | null> {
        return await this.model.findByPk(id, { transaction });
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
                        isActive: true,
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

    async reserveSlot(slot: DateTimeSlot, transaction: Transaction): Promise<void> {
        slot.status = TimeSlotStatus.RESERVED;
        await slot.save({ transaction });
    }

    async bookSlot(id: number, transaction: Transaction): Promise<void> {
        const slot = await this.model.findByPk(id, { transaction });

        if(!slot) {
            throw new NotFoundError(`The slot is not found with id: ${id}`);
        }

        slot.status = TimeSlotStatus.BOOKED;
        await slot.save({ transaction });
    }

    async getSlotDetails(id: number) {
        const slotDetails = await this.model.findByPk(id, {
            attributes: ['id', 'status'],
            include: [
                {
                    model: BookingDate,
                    as: 'bookingDate',
                    attributes: ['bookingDate'],
                    where: {
                        isActive: true
                    },
                },

                {
                    model: BookingTimeSlot,
                    as: 'timeSlot',
                    attributes: ['slotLabel'],
                    where: {
                        isActive: true
                    }
                }
            ]
        });

        return slotDetails;
    }
}

export default DateTimeSlotRepository;