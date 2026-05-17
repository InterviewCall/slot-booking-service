import express from 'express';

import dateTimeSlotRouter from './dateTimeSlot.route';
import pingRouter from './ping.route';

const v1Router = express.Router();

v1Router.use('/ping', pingRouter);

v1Router.use('/date-time-slots', dateTimeSlotRouter);

export default v1Router;