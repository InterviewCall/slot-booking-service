import { NextFunction, Request, Response } from 'express';

import { serverConfig } from '../configs/server.config';
import { InternalServerError, UnauthorizedError } from '../utils/errors/app.error';
import { safeCompareSecrets } from '../utils/helpers/safeCompareSecrets.helper';

const { INTERNAL_API_KEY_HEADER, SCHEDULER_INTERNAL_API_KEY } = serverConfig;

// Guards every service-to-service endpoint: the caller must send the shared secret in the configured header.
export function validateInternalApiKey(req: Request, _res: Response, next: NextFunction) {
    try {
        const providedKey = req.header(INTERNAL_API_KEY_HEADER);
        const expectedKey = SCHEDULER_INTERNAL_API_KEY;

        if(!expectedKey) {
            throw new InternalServerError('SCHEDULER_INTERNAL_API_KEY is not configured');
        }

        if(!providedKey || !safeCompareSecrets(providedKey, expectedKey)) {
            throw new UnauthorizedError('Unauthorized internal service request');
        }

        next();
    } catch (error) {
        next(error);
    }
}