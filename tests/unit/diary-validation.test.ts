import { describe, it, expect } from 'vitest';
import { diaryEntrySchema, diaryFormSchema } from '@/app/validationSchemas';
const input = { movieId: 'legacy-movie', rating: 3, watchedDate: '2020-02-29',review:'',isRewatch:false,containsSpoilers:false,visibility:'PRIVATE',clientRequestId:'7e12c860-c056-4eb6-a2c0-64d765c83c29' };
describe('shared diary validation', () => {
  it.each(['', 'Short', '  A review  '])('accepts optional text consistently: %s', (review) => {
    for (const schema of [diaryEntrySchema, diaryFormSchema]) {
      const result = schema.safeParse({ ...input, review });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.review).toBe(review.trim());
    }
  });
  it('accepts empty review text', () => {
    expect(diaryEntrySchema.parse(input).review).toBe('');
    expect(diaryFormSchema.parse(input).review).toBe('');
  });
  it.each(['nonsense', '2023-02-29', '2020-13-01', ''])('reports invalid dates without throwing: %s', (watchedDate) => {
    expect(diaryEntrySchema.safeParse({ ...input, review: '', watchedDate }).success).toBe(false);
  });
  it.each([0, 6, 2.5])('rejects rating %s', (rating) => {
    expect(diaryEntrySchema.safeParse({ ...input, review: '', rating }).success).toBe(false);
  });
  it('rejects overlong reviews', () => {
    expect(diaryEntrySchema.safeParse({ ...input, review: 'a'.repeat(2001) }).success).toBe(false);
  });
});
