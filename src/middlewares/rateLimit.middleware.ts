import { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';

import { rateLimitConfig } from '../configs/server.config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Health checks and the key-protected internal job route must never be throttled.
function isExempt(req: Request): boolean {
    return req.path === '/v1/ping' || req.path.startsWith('/v1/internal-job');
}

function rateLimitHandler(_req: Request, res: Response): void {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many requests. Please wait a moment and try again.',
        data: {},
        error: {}
    });
}

// Broad per-IP ceiling for every API call.
export const apiRateLimiter = rateLimit({
    windowMs: rateLimitConfig.WINDOW_MS,
    limit: rateLimitConfig.MAX_REQUESTS,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS' || isExempt(req),
    handler: rateLimitHandler
});

// Tighter per-IP ceiling for anything that writes data (form submits, ...).
export const writeRateLimiter = rateLimit({
    windowMs: rateLimitConfig.WINDOW_MS,
    limit: rateLimitConfig.WRITE_MAX_REQUESTS,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => SAFE_METHODS.has(req.method) || isExempt(req),
    handler: rateLimitHandler
});
