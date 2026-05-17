import BookingTimeSlot from '../db/models/BookingTimeSlot.model';
import BaseRepository from './Base.repository';

class BookingTimeSlotRepository extends BaseRepository<BookingTimeSlot> {
    constructor() {
        super(BookingTimeSlot);
    }
}

export default BookingTimeSlotRepository;