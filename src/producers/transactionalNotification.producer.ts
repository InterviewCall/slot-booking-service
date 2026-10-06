import logger from '../configs/logger.config';
import { TRANSACTIONAL_NOTIFICATION_PAYLOAD } from '../constants';
import { BookingNotificationDto } from '../dtos/BookingNotification.dto';
import transactionalNotificationQueue from '../queues/transactionalNotification.queue';

export async function addConfirmationDetailsToQueue(payload: BookingNotificationDto) {
    await transactionalNotificationQueue.add(
        TRANSACTIONAL_NOTIFICATION_PAYLOAD,
        payload
    );

    logger.info(`Payload added to the queue: ${JSON.stringify(payload)}`);
}