import { expect, it, vi } from 'vitest';
import authOptions from '@/app/auth/authOptions';
vi.mock('@/prisma/client', () => ({ default: {} }));

it('keeps the database user ID in the browser session for linked-account authorization', async () => {
  const callback = authOptions.callbacks?.session;
  if (!callback) throw new Error('Missing session callback');
  const result = await callback({ session: { user: { name: 'Existing', email: 'existing@example.invalid', id: '', username: '' }, expires: '2099-01-01' }, token: { id: 'legacy-user-id', username: 'legacy_handle' }, user: { id: 'legacy-user-id', username: 'legacy_handle', email: 'existing@example.invalid', emailVerified: null }, newSession: {}, trigger: 'update' });
  expect(result.user).toMatchObject({ id: 'legacy-user-id', username: 'legacy_handle' });
});
it('does not allow an external post-login redirect', async () => {
  const callback = authOptions.callbacks?.redirect;
  if (!callback) throw new Error('Missing redirect callback');
  expect(await callback({ url: 'https://untrusted.example/path', baseUrl: 'http://localhost:3000' })).toBe('http://localhost:3000');
  expect(await callback({ url: '/diaries', baseUrl: 'http://localhost:3000' })).toBe('http://localhost:3000/diaries');
});
