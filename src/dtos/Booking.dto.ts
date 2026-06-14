import { z } from 'zod';

import { confirmBookingQuerySchema, createBookingBodySchema, getBookingDetailsSchema } from '../validators/booking.validator';

export type CreateBookingDto = z.infer<typeof createBookingBodySchema>;

export type ConfirmBookingDto = z.infer<typeof confirmBookingQuerySchema>;

export type GetBookingDto = z.infer<typeof getBookingDetailsSchema>;