import { BookingStatus } from '../utils/enums/BookingStatus';
import { TimeSlotStatus } from '../utils/enums/TimeSlotStatus';

// ---- what the other services return to this one (internal lookups) ----

export type SubmissionLookupItem = {
    submissionId: string
    status: string
    formSlug: string
    formName: string
    leadScore: number | null
    leadTemperature: 'hot' | 'warm' | 'cold' | null
    candidate: {
        fullName: string
        email: string
        phone: string
    }
    answers: Record<string, string>
}

export type NotificationLookupItem = {
    id: string
    submissionId: string
    bookingId: string | null
    notificationType: 'BOOKING_CONFIRMED' | 'FORM_SUBMITTED_SLOT_NOT_BOOKED_CHECK'
    reminderNumber: number
    channel: 'EMAIL' | 'WHATSAPP'
    sendStatus: 'PROCESSING' | 'SENT' | 'FAILED'
    failedReason: string | null
}

// The form service's answer to the submissions lookup, wrapped in its usual response envelope.
export type SubmissionLookupEnvelope = {
    success: boolean
    data?: { submissions?: SubmissionLookupItem[] }
}

// The notification service's answer to the deliveries lookup, wrapped in its usual response envelope.
export type NotificationLookupEnvelope = {
    success: boolean
    data?: { deliveries?: NotificationLookupItem[] }
}

// How the week service asks the form and notification services (swapped for fakes in tests).
export type SubmissionLookupFn = (submissionIds: string[], answerKeys: string[]) => Promise<SubmissionLookupItem[]>
export type NotificationLookupFn = (submissionIds: string[]) => Promise<NotificationLookupItem[]>

// ---- what the admin panel gets (matches src/types/booking.ts in the panel) ----

export type AdminNotificationItem = {
    id: string
    notificationType: 'BOOKING_CONFIRMED' | 'BOOKING_REMINDER'
    reminderNumber: number
    channel: 'EMAIL' | 'WHATSAPP'
    sendStatus: 'PROCESSING' | 'SENT' | 'FAILED'
    failedReason: string | null
}

export type AdminBookingItem = {
    bookingId: string
    slotStartAt: string
    status: BookingStatus
    completedAt: string | null
    submissionId: string
    formName: string
    candidate: {
        fullName: string
        email: string
        phone: string
    }
    leadScore: number | null
    leadTemperature: 'hot' | 'warm' | 'cold' | null
    notifications: AdminNotificationItem[]
    callPrep: {
        experience: string | null
        currentCtc: string | null
        mainGap: string | null
        urgency: string | null
    }
}

export type AdminWeekSlot = {
    slotId: number
    slotStartAt: string
    status: TimeSlotStatus
}

export type AdminWeekDay = {
    date: string // YYYY-MM-DD (IST)
    slots: AdminWeekSlot[]
}

export type AdminBookingsWeekSummary = {
    callsToday: number
    confirmedThisWeek: number
    completedThisWeek: number
    callsToMark: number
    heldThisWeek: number
    cancelledThisWeek: number
    capacityUsedPercent: number
    failedMessages: number
    nextCallAt: string | null
}

export type AdminBookingsWeekResponse = {
    weekStart: string // YYYY-MM-DD (IST), always a Monday
    bookings: AdminBookingItem[]
    days: AdminWeekDay[]
    summary: AdminBookingsWeekSummary
    // Present only when part of the page could not be filled in, e.g. ["notification-service unavailable"].
    warnings?: string[]
}

// Answer of marking a call done / undoing it.
export type AdminBookingCompletionResponse = {
    bookingId: string
    status: BookingStatus
    completedAt: string | null
}
