import { timingSafeEqual } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

import { serverConfig } from '../configs/server.config';
import { InternalServerError, UnauthorizedError } from '../utils/errors/app.error';

const { INTERNAL_API_KEY_HEADER, SCHEDULER_INTERNAL_API_KEY } = serverConfig;

function safeCompareSecrets(providedKey: string, expectedKey: string): boolean {
    const providedBuffer = Buffer.from(providedKey);
    const expectedBuffer = Buffer.from(expectedKey);

    if (providedBuffer.length != expectedBuffer.length) {
        return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function validateReleaseExpiredSlotRequest(req: Request, _res: Response, next: NextFunction) {
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