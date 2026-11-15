import { z } from 'zod';

import { adminBookingParamsSchema, adminBookingsWeekQuerySchema } from '../validators/adminBooking.validator';

export type AdminBookingsWeekQueryDto = z.infer<typeof adminBookingsWeekQuerySchema>;

export type AdminBookingParamsDto = z.infer<typeof adminBookingParamsSchema>;
