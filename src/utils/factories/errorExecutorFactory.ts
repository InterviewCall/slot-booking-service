import { StatusCodes } from 'http-status-codes';

import { AppError, BadRequestError, InternalServerError, NotFoundError } from '../errors/app.error';

export function createErrorExecutor(statusCode: number, message: string): AppError | null {
    if(statusCode == StatusCodes.NOT_FOUND) {
        return new NotFoundError(message);
    } else if(statusCode == StatusCodes.BAD_REQUEST) {
        return new BadRequestError(message);
    } else if(statusCode == StatusCodes.INTERNAL_SERVER_ERROR) {
        return new InternalServerError(message);
    } else {
        return null;
    }
}