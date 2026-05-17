import { SuccessResponse } from '../../types/Response.type';

export function buildSuccessResponse<T>(message: string, data: T): SuccessResponse<T> {
    return {
        success: true,
        message,
        data,
        error: {}
    };
}