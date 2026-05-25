import axios from 'axios';

import { serverConfig } from './server.config';

export const candidateFormDetailsApi = axios.create({
    baseURL: serverConfig.CANDIDATE_FORM_DETAILS_SERVICE_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});