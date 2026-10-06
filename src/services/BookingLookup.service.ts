import BookingRepository from '../repositories/Booking.repository';
import { BookingLookupItem, BookingLookupResponse } from '../types/BookingLookup.type';

class BookingLookupService {
    constructor(private readonly bookingRepository: BookingRepository) {}

    // One entry per submission that has a booking: its latest one. Submissions without a booking are simply not listed.
    async lookupBySubmissionIds(submissionIds: string[]): Promise<BookingLookupResponse> {
        const uniqueIds = Array.from(new Set(submissionIds));
        const bookings = await this.bookingRepository.findCountedBookingsForSubmissions(uniqueIds);

        // Rows come newest first, so the first one seen for a submission is its latest booking.
        const latestBySubmission = new Map<string, BookingLookupItem>();

        for (const booking of bookings) {
            if (latestBySubmission.has(booking.submissionId)) {
                continue;
            }

            latestBySubmission.set(booking.submissionId, {
                submissionId: booking.submissionId,
                bookingId: String(booking.id),
                status: booking.status,
                slotId: booking.dateTimeSlot!.id,
                slotStartAt: booking.dateTimeSlot!.slotStartAt.toISOString(),
                createdAt: booking.createdAt.toISOString(),
                confirmedAt: booking.confirmedAt ? booking.confirmedAt.toISOString() : null,
                cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
                completedAt: booking.completedAt ? booking.completedAt.toISOString() : null,
                cancelSource: booking.cancelSource,
            });
        }

        return { bookings: Array.from(latestBySubmission.values()) };
    }
}

export default BookingLookupService;
