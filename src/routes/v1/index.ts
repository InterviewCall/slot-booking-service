import express from 'express';

import bookingRouter from './booking.route';
import dateTimeSlotRouter from './dateTimeSlot.route';
import pingRouter from './ping.route';
import reservationRouter from './reservation.route';

const v1Router = express.Router();

v1Router.use('/ping', pingRouter);

v1Router.use('/date-time-slots', dateTimeSlotRouter);

v1Router.use('/bookings', bookingRouter);

v1Router.use('/reservations', reservationRouter);

export default v1Router;