/** Calendar-only values always retain their UTC date when displayed. */
export function parseCalendarDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01')
        return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
export function calendarDate(value: Date | string): string { return new Date(value).toISOString().slice(0, 10); }
export function isTimeZone(value: string): boolean {
    try {
        new Intl.DateTimeFormat('en', { timeZone: value }).format();
        return value.length <= 100;
    }
    catch {
        return false;
    }
}
export function todayInTimeZone(zone: string | null | undefined, now = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone && isTimeZone(zone) ? zone : 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-');
}
export function validateWatchedDate(value: string, zone?: string | null, now = new Date()): boolean { return !!parseCalendarDate(value) && value <= todayInTimeZone(zone, now); }
