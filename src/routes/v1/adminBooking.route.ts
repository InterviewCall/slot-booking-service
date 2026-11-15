import { Router } from 'express';

import adminBookingController from '../../controllers/adminBooking.controller';
import { validateRequestParams, validateRequestQuery } from '../../validators';
import { adminBookingParamsSchema, adminBookingsWeekQuerySchema } from '../../validators/adminBooking.validator';

const adminBookingRouter = Router();

// GET /api/v1/admin/bookings/week?weekStart=YYYY-MM-DD
adminBookingRouter.get(
    '/week',
    validateRequestQuery(adminBookingsWeekQuerySchema),
    adminBookingController.getBookingsWeekHandler
);

// POST /api/v1/admin/bookings/:bookingId/complete   - mark the call as done
adminBookingRouter.post(
    '/:bookingId/complete',
    validateRequestParams(adminBookingParamsSchema),
    adminBookingController.completeBookingHandler
);

// DELETE /api/v1/admin/bookings/:bookingId/complete - take that back (the booking is confirmed again)
adminBookingRouter.delete(
    '/:bookingId/complete',
    validateRequestParams(adminBookingParamsSchema),
    adminBookingController.undoCompleteBookingHandler
);

export default adminBookingRouter;
