import { BookingCancelSource } from '../utils/enums/BookingCancelSource';
import { BookingStatus } from '../utils/enums/BookingStatus';

// One row of the lookup the form service uses to show booking details next to each submission.
export type BookingLookupItem = {
    submissionId: string
    bookingId: string
    status: BookingStatus
    slotId: number
    slotStartAt: string
    createdAt: string
    confirmedAt: string | null
    cancelledAt: string | null
    completedAt: string | null
    cancelSource: BookingCancelSource | null
}

export type BookingLookupResponse = {
    bookings: BookingLookupItem[]
}
