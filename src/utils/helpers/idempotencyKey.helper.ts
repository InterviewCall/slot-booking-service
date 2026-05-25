import { v4 as UUIdV4, validate as isValidUUID } from 'uuid';

export function generateIdempotencyKey(): string {
    return UUIdV4();
}

export function checkIsValidUUID(uuid: string): boolean {
    return isValidUUID(uuid);
}