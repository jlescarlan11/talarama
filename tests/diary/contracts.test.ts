import { describe, it, expect } from 'vitest';
import { diaryEntrySchema } from '@/app/validationSchemas';
import { calendarDate, todayInTimeZone, validateWatchedDate } from '@/app/lib/diary/dates';
import { previewLegacyDates } from '@/app/lib/diary/legacy-dates';
const input = { movieId: 'legacy', watchedDate: '2020-02-29', rating: null, review: '  ok  ', isRewatch: false, containsSpoilers: false, visibility: 'PRIVATE', clientRequestId: 'cad99932-a710-4229-82d3-a28f39f28952' };
describe('shared diary contract', () => {
 it('accepts unrated, trims reviews, preserves integer scale', () => {
  expect(diaryEntrySchema.parse(input)).toMatchObject({ rating: null, review: 'ok' });
  for (const rating of [1,2,3,4,5]) expect(diaryEntrySchema.parse({ ...input,rating }).rating).toBe(rating);
  for (const rating of [0,6,1.5,'4',undefined]) expect(diaryEntrySchema.safeParse({...input,rating}).success).toBe(false);
  expect(diaryEntrySchema.parse({...input,review:''}).review).toBe('');
  expect(diaryEntrySchema.safeParse({...input,review:'x'.repeat(2001)}).success).toBe(false);
 });
 it('rejects contradictory and malformed payloads', () => {
  for (const watchedDate of ['2021-02-29','2020-04-31','2020-01-01T00:00:00Z','0000-01-01','2020-1-1']) expect(diaryEntrySchema.safeParse({...input,watchedDate}).success).toBe(false);
  expect(diaryEntrySchema.safeParse({...input,userId:'other'}).success).toBe(false);
  expect(diaryEntrySchema.safeParse({...input,visibility:'friends'}).success).toBe(false);
 });
 it('validates future dates in the saved timezone and serializes UTC dates', () => {
  const now = new Date('2024-02-29T10:30:00Z');
  expect(todayInTimeZone('Pacific/Kiritimati',now)).toBe('2024-03-01');
  expect(todayInTimeZone('Etc/GMT+12',now)).toBe('2024-02-28');
  expect(validateWatchedDate('2024-02-29','Etc/GMT+12',now)).toBe(false);
  expect(validateWatchedDate('2024-03-01','Pacific/Kiritimati',now)).toBe(true);
  expect(todayInTimeZone('invalid',now)).toBe('2024-02-29');
  expect(calendarDate(new Date('2024-02-29T00:00:00Z'))).toBe('2024-02-29');
 });
 it('previews original timestamps and flags ambiguous interpretations without mutating', () => {
  const records = [{ id:'a',watchedDate:new Date('2020-02-29T23:30:00Z'),user:{timeZone:'Asia/Manila'} },{id:'b',watchedDate:new Date('2020-02-29T00:00:00Z'),user:{timeZone:null}}];
  const report=previewLegacyDates(records);
  expect(report[0]).toMatchObject({id:'a',original:'2020-02-29T23:30:00.000Z',utcDate:'2020-02-29',userDate:'2020-03-01',ambiguous:true});
  expect(report[1]).toMatchObject({id:'b',ambiguous:false});
  expect(records[0].watchedDate.toISOString()).toBe('2020-02-29T23:30:00.000Z');
 });
});
