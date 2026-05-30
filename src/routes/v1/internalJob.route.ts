import { Router } from 'express';

import reservationController from '../../controllers/reservation.controller';
import { validateReleaseExpiredSlotRequest } from '../../middlewares/validateReleaseExpiredSlotReservationRequest.middleware';

const internalJobRouter = Router();

internalJobRouter.put(
    '/release-expired-slot-reservations',
    validateReleaseExpiredSlotRequest,
    reservationController.releaseExpiredSlotReservationsHandler
);

export default internalJobRouter;