import { Queue } from 'bullmq';

import { bullMqConnection } from '../configs/bullMq.config';
import { TRANSACTIONAL_NOTIFICATION_QUEUE  } from '../constants';
import { BookingNotificationDto } from '../dtos/BookingNotification.dto';

const transactionalNotificationQueue = new Queue<BookingNotificationDto>(
    TRANSACTIONAL_NOTIFICATION_QUEUE,
    {
        connection: bullMqConnection,

        defaultJobOptions: {
            attempts: 2,
            backoff: {
                type: 'exponential',
                delay: 5000
            },

            removeOnComplete: {
                age: 24 * 60 * 60,
                count: 1000
            },

            removeOnFail: {
                age: 7 * 24 * 60 * 60,
                count: 5000
            }
        }
    }
);

export default transactionalNotificationQueue;