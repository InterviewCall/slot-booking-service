import { Router } from 'express';

import bookingController from '../../controllers/booking.controller';
import { validateRequestBody, validateRequestParams, validateRequestQuery } from '../../validators';
import { confirmBookingQuerySchema, createBookingBodySchema, getBookingDetailsSchema } from '../../validators/booking.validator';

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

bookingRouter.get(
    '/:bookingId',
    validateRequestParams(getBookingDetailsSchema),
    bookingController.getBookingDetailsHandler
);

export default bookingRouter;