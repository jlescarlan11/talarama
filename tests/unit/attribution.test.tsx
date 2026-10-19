import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Footer from '@/app/components/Footer';
import About from '@/app/about/page';

it('makes provider credits reachable and keeps contributor credits', () => {
  render(<Footer />);
  expect(screen.getByRole('link', { name: 'About & credits' })).toHaveAttribute('href', '/about');
  expect(screen.getByText(/Bisuela, Caringal, Dela Cruz, and Escarlan/)).toBeVisible();
});

it('credits TMDB with its official mark, both notices and separate upstream rights', () => {
  render(<About />);
  expect(screen.getByRole('img', { name: 'TMDB' })).toHaveAttribute('src', '/tmdb-blue-short.svg');
  expect(screen.getByText('This product uses the TMDB API but is not endorsed or certified by TMDB.')).toBeVisible();
  expect(screen.getByText('This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.')).toBeVisible();
  expect(screen.getByRole('link', { name: 'TMDB' })).toHaveAttribute('href', 'https://www.themoviedb.org');
  expect(screen.getByText(/artwork and data remain subject to their respective rights/)).toBeVisible();
});
