import { calendarDate, todayInTimeZone } from './dates';
export function previewLegacyDates(entries: {
    id: string;
    watchedDate: Date;
    user: {
        timeZone: string | null;
    };
}[]) {
    return entries.map(entry => ({ id: entry.id, original: entry.watchedDate.toISOString(), utcDate: calendarDate(entry.watchedDate), userDate: todayInTimeZone(entry.user.timeZone, entry.watchedDate), timeZone: entry.user.timeZone ?? 'UTC', ambiguous: entry.watchedDate.toISOString().slice(11) !== '00:00:00.000Z' }));
}
