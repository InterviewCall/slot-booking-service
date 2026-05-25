import { Router } from 'express';

import dateTimeSlotController from '../../controllers/dateTimeSlot.controller';
import { validateRequestQuery } from '../../validators';
import { getAvailableSlotsQuerySchema } from '../../validators/availabilitySlot.validator';

const dateTimeSlotRouter = Router();

dateTimeSlotRouter.get(
    '/available-slots',
    validateRequestQuery(getAvailableSlotsQuerySchema),
    dateTimeSlotController.getAllAvailabilitySlotsHandler
);

dateTimeSlotRouter.get(
    '/:slotId',
    dateTimeSlotController.getSlotDetailsHandler
);

export default dateTimeSlotRouter;