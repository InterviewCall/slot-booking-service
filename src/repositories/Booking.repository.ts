import Booking from '../db/models/Booking.model';
import BaseRepository from './Base.repository';

class BookingRepository extends BaseRepository<Booking> {
    constructor() {
        super(Booking);
    }
}

export default BookingRepository;