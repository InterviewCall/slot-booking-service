import { StatusCodes } from 'http-status-codes';

export interface AppError extends Error {
    statusCode: number
}

export class InternalServerError implements AppError {
    statusCode: number;
    message: string;
    name: string;

    constructor(message: string) {
        this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        this.message = message;
        this.name = 'InternalServerError';
    }
}

export class BadRequestError implements AppError {
    statusCode: number;
    message: string;
    name: string;

    constructor(message: string) {
        this.statusCode = StatusCodes.BAD_REQUEST;
        this.message = message;
        this.name = 'BadRequestError';
    }
}

export class NotFoundError implements AppError {
    statusCode: number;
    message: string;
    name: string;

    constructor(message: string) {
        this.statusCode = StatusCodes.NOT_FOUND;
        this.message = message;
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError implements AppError {
    statusCode: number;
    message: string;
    name: string;

    constructor(message: string) {
        this.statusCode = StatusCodes.UNAUTHORIZED;
        this.message = message;
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError implements AppError {
    statusCode: number;
    message: string;
    name: string;

    constructor(message: string) {
        this.statusCode = StatusCodes.FORBIDDEN;
        this.message = message;
        this.name = 'ForbiddenError';
    }
}

export class ConflictError implements AppError {
    statusCode: number;
    message: string;
    name: string;

    constructor(message: string) {
        this.statusCode = StatusCodes.CONFLICT;
        this.message = message;
        this.name = 'ConflictError';
    }
}

export class NotImplementedError implements AppError {
    statusCode: number;
    message: string;
    name: string;

    constructor(message: string) {
        this.statusCode = StatusCodes.NOT_IMPLEMENTED;
        this.message = message;
        this.name = 'NotImplementedError';
    }
}

export class GoneError implements AppError {
    statusCode: number;
    message: string;
    name: string;

    constructor(message: string) {
        this.statusCode = StatusCodes.GONE;
        this.message = message;
        this.name = 'GoneError';
    }
}