// How many submission ids one internal lookup call may carry. Both sides of a call must agree on the number.

// What this service accepts from the form service (POST /internal/bookings/lookup).
export const MAX_LOOKUP_SUBMISSION_IDS = 100;

// What this service sends: the form service accepts at most this many ids per call.
export const SUBMISSION_LOOKUP_MAX_IDS = 100;

// The notification service accepts at most this many ids per call.
export const NOTIFICATION_LOOKUP_MAX_IDS = 100;
