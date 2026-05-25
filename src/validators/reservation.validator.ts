import { z } from 'zod';

export const reservationParamsSchema = z.object({
    reservationId: z
        .string({ message: 'reservationId must be presnt' })
        .uuid('resrvationId must be a valid UUID'),
});