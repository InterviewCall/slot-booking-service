import axios from 'axios';

import { serverConfig } from './server.config';

export const candidateFormDetailsApi = axios.create({
    baseURL: serverConfig.CANDIDATE_FORM_DETAILS_SERVICE_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Service-to-service calls: they carry the shared secret and give up quickly, so a slow service cannot hang an admin page.
const internalHeaders = {
    'Content-Type': 'application/json',
    [serverConfig.INTERNAL_API_KEY_HEADER]: serverConfig.SCHEDULER_INTERNAL_API_KEY
};

export const candidateFormDetailsInternalApi = axios.create({
    baseURL: serverConfig.CANDIDATE_FORM_DETAILS_SERVICE_BASE_URL,
    timeout: serverConfig.INTERNAL_SERVICE_TIMEOUT_MS,
    headers: internalHeaders
});

export const notificationServiceApi = axios.create({
    baseURL: serverConfig.NOTIFICATION_SERVICE_BASE_URL,
    timeout: serverConfig.INTERNAL_SERVICE_TIMEOUT_MS,
    headers: internalHeaders
});
