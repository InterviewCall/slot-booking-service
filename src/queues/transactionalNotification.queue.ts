import { Queue } from 'bullmq';

import { bullMqConnection } from '../configs/bullMq.config';
import { defaultJobOptions } from '../configs/queueOptions.config';
import { TRANSACTIONAL_NOTIFICATION_QUEUE  } from '../constants';
import { BookingNotificationDto } from '../dtos/BookingNotification.dto';

const transactionalNotificationQueue = new Queue<BookingNotificationDto>(
    TRANSACTIONAL_NOTIFICATION_QUEUE,
    {
        connection: bullMqConnection,

        defaultJobOptions
    }
);

export default transactionalNotificationQueue;