import { z } from 'zod';

export const getAvailableSlotsQuerySchema = z.object({
    bookingDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'bookingDate must be in YYYY-MM-DD format')
});