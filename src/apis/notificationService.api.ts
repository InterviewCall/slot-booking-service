import { notificationServiceApi } from '../configs/axios.config';
import { serverConfig } from '../configs/server.config';
import { NOTIFICATION_LOOKUP_MAX_IDS } from '../constants/lookup';
import { NotificationLookupEnvelope, NotificationLookupItem } from '../types/AdminBooking.type';

/**
 * Every delivery (email / WhatsApp) of the given submissions, oldest first.
 * Throws when the service cannot be reached or answers with an error; the caller decides whether that is fatal.
 */
export async function lookupNotificationsBySubmissionIds(submissionIds: string[]): Promise<NotificationLookupItem[]> {
    if (!serverConfig.SCHEDULER_INTERNAL_API_KEY) {
        throw new Error('SCHEDULER_INTERNAL_API_KEY is not configured');
    }

    const deliveries: NotificationLookupItem[] = [];

    for (let index = 0; index < submissionIds.length; index += NOTIFICATION_LOOKUP_MAX_IDS) {
        const chunk = submissionIds.slice(index, index + NOTIFICATION_LOOKUP_MAX_IDS);
        const response = await notificationServiceApi.post<NotificationLookupEnvelope>('/internal/notifications/lookup', { submissionIds: chunk });

        if (!response.data.success || !Array.isArray(response.data.data?.deliveries)) {
            throw new Error('Notification service lookup returned an unexpected response');
        }

        deliveries.push(...response.data.data.deliveries);
    }

    return deliveries;
}
