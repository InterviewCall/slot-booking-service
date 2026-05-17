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

// this function returns this 2026-05-17 15:03:57  

// import dayjs from 'dayjs';
// import utc from 'dayjs/plugin/utc';

// dayjs.extend(utc);

// const DEFAULT_BOOKING_CUTOFF_MINUTES = 10;

// export function getBookingCutoffTime(
//     cutoffMinutes: number = DEFAULT_BOOKING_CUTOFF_MINUTES
// ): string {
//     // 330 minutes is exactly 5 hours and 30 minutes (+05:30 for IST)
//     const IST_OFFSET_MINUTES = 330; 

//     return dayjs()
//         .utcOffset(IST_OFFSET_MINUTES)
//         .add(cutoffMinutes, 'minute')
//         .format('YYYY-MM-DD HH:mm:ss');
// }
