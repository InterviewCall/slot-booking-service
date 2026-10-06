import express from 'express';

import adminBookingRouter from './adminBooking.route';
import bookingRouter from './booking.route';
import dateTimeSlotRouter from './dateTimeSlot.route';
import internalBookingRouter from './internalBooking.route';
import internalJobRouter from './internalJob.route';
import pingRouter from './ping.route';
import reservationRouter from './reservation.route';

const v1Router = express.Router();

v1Router.use('/ping', pingRouter);

v1Router.use('/date-time-slots', dateTimeSlotRouter);

v1Router.use('/bookings', bookingRouter);

v1Router.use('/reservations', reservationRouter);

v1Router.use('/internal-job', internalJobRouter);

v1Router.use('/internal/bookings', internalBookingRouter);

// Admin panel
v1Router.use('/admin/bookings', adminBookingRouter);

export default v1Router;