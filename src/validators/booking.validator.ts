import { z } from 'zod';

import { MAX_LOOKUP_SUBMISSION_IDS } from '../constants/lookup';

export const createBookingBodySchema = z.object({
    dateTimeSlotId: z.coerce
        .number()
        .int('dateTimeSlotId must be an integer')
        .positive('dateTimeSlotId must be a positive number'),

    submissionId: z
        .string()
        .uuid('submissionId must be a valid UUID'),
});

export const confirmBookingQuerySchema = z.object({
    reservationId: z
        .string({ message: 'reservationId must be presnt' })
        .uuid('resrvationId must be a valid UUID'),
});

export const createBookingValidationSchema = {
    body: createBookingBodySchema,
};

export const getBookingDetailsSchema = z.object({
    bookingId: z.coerce
        .bigint()
        .positive('Booking Id must be a positive integer')
});

// Internal lookup used by the form service: the public ids of the submissions on the page being shown.

export const lookupBookingsBodySchema = z.object({
    submissionIds: z
        .array(z.string().uuid('Every submission id must be a valid UUID'), { message: 'submissionIds must be a list of UUIDs' })
        .max(MAX_LOOKUP_SUBMISSION_IDS, `At most ${MAX_LOOKUP_SUBMISSION_IDS} submission ids can be looked up at once`),
});
