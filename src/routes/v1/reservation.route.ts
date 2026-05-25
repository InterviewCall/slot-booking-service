import { Router } from 'express';

import reservationController from '../../controllers/reservation.controller';
import { validateRequestParams } from '../../validators';
import { reservationParamsSchema } from '../../validators/reservation.validator';

const reservationRouter = Router();

reservationRouter.get(
    '/:reservationId',
    validateRequestParams(reservationParamsSchema),
    reservationController.getReservationDetailsHandler
);

reservationRouter.delete(
    '/cancel/:reservationId',
    validateRequestParams(reservationParamsSchema),
    reservationController.cancelReservationHandler
);

export default reservationRouter;