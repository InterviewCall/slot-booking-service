import cron from 'node-cron';

import BookingRepository from '../repositories/Booking.repository';
import DateTimeSlotRepository from '../repositories/DateTimeSlot.repository';
import IdempotencyKeyRepository from '../repositories/IdempotencyKey.repository';
import ReservationService from '../services/Reservation.service';

const reservationService = new ReservationService(
    new IdempotencyKeyRepository(),
    new BookingRepository(),
    new DateTimeSlotRepository()
);

export function releaseSlotCron(): void {
    cron.schedule('*/10 * * * * *', async () => {
        await reservationService.releaseExpiredSlotReservations();
    });
}