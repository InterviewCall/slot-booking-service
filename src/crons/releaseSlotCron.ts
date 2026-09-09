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
    setInterval(async () => {
        await reservationService.releaseExpiredSlotReservations();
    }, 10000);
}