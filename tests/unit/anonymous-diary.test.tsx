vi.mock('server-only',()=>({}));
import React from 'react';
import { it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DiaryPage from '@/app/diaries/page';
vi.mock('next-auth', () => ({ getServerSession: vi.fn().mockResolvedValue(null) }));
vi.mock('@/app/auth/authOptions', () => ({ default: {} }));
vi.mock('@/prisma/client', () => ({ default: {} }));
it('renders a sign-in page for an anonymous diary visitor', async () => {
  const page = await DiaryPage();
  const html = renderToStaticMarkup(page as React.ReactElement);
  expect(html).toMatch(/sign in/i);
});
