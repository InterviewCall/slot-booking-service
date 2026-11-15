import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

export function formatBookingDate(date: string): string {
    return dayjs(date).format('Do MMMM, YYYY');
}