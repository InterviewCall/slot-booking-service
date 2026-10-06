import { timingSafeEqual } from 'node:crypto';

// Compares two secrets without leaking, through timing, how many leading characters matched.
export function safeCompareSecrets(providedKey: string, expectedKey: string): boolean {
    const providedBuffer = Buffer.from(providedKey);
    const expectedBuffer = Buffer.from(expectedKey);

    if (providedBuffer.length != expectedBuffer.length) {
        return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
}
