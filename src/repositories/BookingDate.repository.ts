import BookingDate from '../db/models/BookingDate.model';
import BaseRepository from './Base.repository';

class BookingDateRepository extends BaseRepository<BookingDate> {
    constructor() {
        super(BookingDate);
    }
}

export default BookingDateRepository;