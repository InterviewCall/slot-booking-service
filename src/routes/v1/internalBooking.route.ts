import { Router } from 'express';

import internalBookingController from '../../controllers/internalBooking.controller';
import { validateInternalApiKey } from '../../middlewares/internalApiKey.middleware';
import { validateRequestBody } from '../../validators';
import { lookupBookingsBodySchema } from '../../validators/booking.validator';

const internalBookingRouter = Router();

// POST /api/v1/internal/bookings/lookup
internalBookingRouter.post(
    '/lookup',
    validateInternalApiKey,
    validateRequestBody(lookupBookingsBodySchema),
    internalBookingController.lookupBookingsHandler
);

export default internalBookingRouter;
