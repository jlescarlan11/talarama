import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import StarRating from '@/app/diaries/new/StarRating';
it('exposes the selected rating and persistent accessible action labels', () => {
  const onChange = vi.fn();
  render(<StarRating rating={3} onRatingChange={onChange} />);
  const button = screen.getByRole('button', { name: 'Rate 4 out of 5' });
  fireEvent.click(button);
  expect(onChange).toHaveBeenCalledWith(4);
  expect(screen.getByRole('button', { name: 'Rate 3 out of 5' })).toHaveAttribute('aria-pressed', 'true');
});
