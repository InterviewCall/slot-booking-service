import { z } from 'zod';

import { confirmBookingQuerySchema, createBookingBodySchema } from '../validators/booking.validator';

export type CreateBookingDto = z.infer<typeof createBookingBodySchema>;

export type ConfirmBookingDto = z.infer<typeof confirmBookingQuerySchema>;