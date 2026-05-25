import dayjs from 'dayjs';

export function getReservationExpiredTime(targetTime: Date) {
    const countdownTarget = dayjs(targetTime).add(60, 'second');
    return countdownTarget.toISOString();
}