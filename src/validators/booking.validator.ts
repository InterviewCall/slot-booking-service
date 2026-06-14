import { z } from 'zod';

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