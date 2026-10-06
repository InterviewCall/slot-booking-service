import { z } from 'zod';

import { confirmBookingQuerySchema, createBookingBodySchema, getBookingDetailsSchema, lookupBookingsBodySchema } from '../validators/booking.validator';

export type CreateBookingDto = z.infer<typeof createBookingBodySchema>;

export type ConfirmBookingDto = z.infer<typeof confirmBookingQuerySchema>;

export type GetBookingDto = z.infer<typeof getBookingDetailsSchema>;
export type LookupBookingsDto = z.infer<typeof lookupBookingsBodySchema>;
