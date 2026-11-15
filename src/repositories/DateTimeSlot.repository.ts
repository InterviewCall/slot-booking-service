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
            attributes: ['id'],
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

    /**
     * Every slot starting inside [start, end), blocked ones included, with whether its hour and its date are switched on.
     *
     *   SELECT s.id, s.slot_start_at, s.status, t.is_active, d.is_active
     *   FROM date_time_slots s
     *   JOIN booking_time_slots t ON t.id = s.booking_time_slot_id
     *   JOIN booking_dates d ON d.id = s.booking_date_id
     *   WHERE s.slot_start_at >= ? AND s.slot_start_at < ? AND s.deleted_at IS NULL
     *   ORDER BY s.slot_start_at ASC
     */
    async findSlotsInRange(start: Date, end: Date): Promise<DateTimeSlot[]> {
        return await this.model.findAll({
            where: {
                slotStartAt: { [Op.gte]: start, [Op.lt]: end },
                deletedAt: null,
            },
            attributes: ['id', 'slotStartAt', 'status'],
            include: [
                { model: BookingTimeSlot, as: 'timeSlot', attributes: ['id', 'isActive'], required: true },
                { model: BookingDate, as: 'bookingDate', attributes: ['id', 'isActive'], required: true },
            ],
            order: [['slotStartAt', 'ASC']],
        });
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

    async getSlotDetails(id: number): Promise<DateTimeSlot | null> {
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

    async availableSlots(slotIds: number[], transaction: Transaction): Promise<number> {
        const [affectedCount] = await this.model.update({
            status: TimeSlotStatus.AVAILABLE
        }, {
            where: {
                id: {
                    [Op.in]: slotIds
                },
                status: TimeSlotStatus.RESERVED
            },
            transaction
        });

        return affectedCount;
    }
}

export default DateTimeSlotRepository;