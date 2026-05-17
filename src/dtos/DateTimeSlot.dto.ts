import { z } from 'zod';

import { getAvailableSlotsQuerySchema } from '../validators/availabilitySlot.validator';

export type GetAvailableSlotsDto = z.infer<typeof getAvailableSlotsQuerySchema>;