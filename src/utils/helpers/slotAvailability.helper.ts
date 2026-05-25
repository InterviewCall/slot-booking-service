import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_BOOKING_CUTOFF_MINUTES = 10;
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export function getBookingCutoffTime(
    cutoffMinutes: number = DEFAULT_BOOKING_CUTOFF_MINUTES,
    timezoneName: string = DEFAULT_TIMEZONE
): string {
    return dayjs()
        .tz(timezoneName)
        .add(cutoffMinutes, 'minute')
        .format('YYYY-MM-DD HH:mm:ss');
}
