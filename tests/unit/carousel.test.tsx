import React from 'react';
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import MovieCarousel from '@/app/components/MovieCarousel';
it('renders a useful empty carousel without dereferencing a missing movie', () => {
  render(<MovieCarousel movies={[]} />);
  expect(screen.getByText(/no movies/i)).toBeVisible();
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
});
