// The question keys the call-prep card shows. A form that does not have one of them simply returns null for it.
export const CALL_PREP_ANSWER_KEYS = ['yoe', 'currentCtc', 'mainGap', 'urgency'];

// How long an unconfirmed hold lasts (see getReservationExpiredTime).
export const HOLD_DURATION_MS = 60 * 1000;

// Sent in `warnings` when part of the admin bookings page could not be filled in.
export const NOTIFICATION_SERVICE_UNAVAILABLE_WARNING = 'notification-service unavailable';
