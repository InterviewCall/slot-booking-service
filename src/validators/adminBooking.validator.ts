import { z } from 'zod';

import { isMondayYmd } from '../utils/helpers/weekRange.helper';

export const adminBookingsWeekQuerySchema = z.object({
    weekStart: z
        .string({ message: 'weekStart is required (YYYY-MM-DD)' })
        .refine(isMondayYmd, 'weekStart must be a Monday in the format YYYY-MM-DD'),
});

// Checked as text first: a bigint schema cannot be turned into an error response when its check fails (BigInt is not JSON).
export const adminBookingParamsSchema = z.object({
    bookingId: z
        .string({ message: 'bookingId is required' })
        .regex(/^[1-9]\d{0,17}$/, 'bookingId must be a positive whole number')
        .transform((value) => BigInt(value)),
});
