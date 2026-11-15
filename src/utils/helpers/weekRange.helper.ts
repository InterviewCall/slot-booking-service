// The panel's week is Monday to Sunday in IST (UTC+05:30, no daylight saving).
const IST_OFFSET_MINUTES = 330;
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/** "2026-10-05" for the IST calendar day the instant falls on. */
export function toIstDate(instant: Date): string {
    return new Date(instant.getTime() + IST_OFFSET_MINUTES * MS_PER_MINUTE).toISOString().slice(0, 10);
}

/** The instant a given IST calendar day starts. */
export function istDayStart(ymd: string): Date {
    return new Date(`${ymd}T00:00:00+05:30`);
}

export function addDaysToIstDate(ymd: string, days: number): string {
    return toIstDate(new Date(istDayStart(ymd).getTime() + days * MS_PER_DAY));
}

/** True for a real calendar date (no 2026-02-30) that falls on a Monday. */
export function isMondayYmd(ymd: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
        return false;
    }

    const noon = new Date(`${ymd}T12:00:00+05:30`);
    return !Number.isNaN(noon.getTime()) && toIstDate(noon) === ymd && noon.getUTCDay() === 1;
}

export function getWeekRange(weekStart: string): { start: Date, end: Date } {
    const start = istDayStart(weekStart);
    return { start, end: new Date(start.getTime() + 7 * MS_PER_DAY) };
}
