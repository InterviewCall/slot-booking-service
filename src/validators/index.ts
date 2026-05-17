import { NextFunction,Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodTypeAny } from 'zod';
import { ZodError } from 'zod/v4';

import logger from '../configs/logger.config';

/**
 * 
 * @param schema - Zod Schema to validate the Request Body
 * @returns - Middlewarefunction to validate the Request Body
 */

export const validateRequestBody = (schema: ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await schema.parseAsync(req.body);
        next();
    } catch (error) {
        //If validation fails 
        if(error instanceof ZodError) {
            const formattedErrors = error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code
            }));

            logger.error('Invalid request body', {
                receivedStructure: req.body,
                validationErrors: formattedErrors,
            });

            return res.status(StatusCodes.BAD_REQUEST).json({
                success: 'false',
                message: formattedErrors[0]?.message || 'Invalid request body',
                error: formattedErrors
            });
        }

        logger.error('Request body validation failed unexpectedly', {
            receivedStructure: req.body,
            error,
        });
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid Request Body',
            error
        });
    }
};

export const validateRequestQuery = (schema: ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await schema.parseAsync(req.query);
        next();
    } catch (error) {
        //If validation fails 
        if(error instanceof ZodError) {
            const formattedErrors = error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code
            }));

            logger.error('Invalid request query', {
                receivedStructure: req.query,
                validationErrors: formattedErrors,
            });

            return res.status(StatusCodes.BAD_REQUEST).json({
                success: 'false',
                message: formattedErrors[0]?.message || 'Invalid request query',
                error: formattedErrors
            });
        }

        logger.error('Request query validation failed unexpectedly', {
            receivedStructure: req.body,
            error,
        });
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid Request Query',
            error
        });
    }
};

export const validateRequestParams = (schema: ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await schema.parseAsync(req.params);
        next();
    } catch (error) {
        //If validation fails 
        if(error instanceof ZodError) {
            const formattedErrors = error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code
            }));

            logger.error('Invalid request params', {
                receivedStructure: req.params,
                validationErrors: formattedErrors,
            });

            return res.status(StatusCodes.BAD_REQUEST).json({
                success: 'false',
                message: formattedErrors[0]?.message || 'Invalid request params',
                error: formattedErrors
            });
        }

        logger.error('Request params validation failed unexpectedly', {
            receivedStructure: req.body,
            error,
        });
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid Request Params',
            error
        });
    }
};