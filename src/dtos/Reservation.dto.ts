import { z } from 'zod';

import { reservationParamsSchema } from '../validators/reservation.validator';

export type ReservationParamsDto = z.infer<typeof reservationParamsSchema>;