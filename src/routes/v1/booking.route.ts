import { Router } from 'express';

import bookingController from '../../controllers/booking.controller';
import { validateRequestBody, validateRequestQuery } from '../../validators';
import { confirmBookingQuerySchema, createBookingBodySchema } from '../../validators/booking.validator';

const bookingRouter = Router();

bookingRouter.post(
    '/create-booking',
    validateRequestBody(createBookingBodySchema),
    bookingController.createBookingHandler
);

bookingRouter.patch(
    '/confirm-booking',
    validateRequestQuery(confirmBookingQuerySchema),
    bookingController.confirmBookingHandler
);

export default bookingRouter;