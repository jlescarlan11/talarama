import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import MovieCarousel from '@/app/components/MovieCarousel';

const movies = Array.from({ length: 6 }, (_, index) => ({
  id: `movie-${index}`, title: `Movie ${index}`, releasedYear: 2000,
  duration: 90, description: null, posterUrl: null, directorFirstName: null,
  directorLastName: null, createdAt: new Date('2020-01-01'), genres: [],
}));
let motion: MediaQueryList;
let listeners: Set<(event: MediaQueryListEvent) => void>;
beforeEach(() => {
  vi.useFakeTimers();
  listeners = new Set();
  motion = { matches: false, media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  } as unknown as MediaQueryList;
  vi.stubGlobal('matchMedia', vi.fn(() => motion));
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: vi.fn(), configurable: true });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo'); });
const active = () => screen.getByRole('tab', { selected: true }).getAttribute('aria-label');
const advance = () => act(() => { vi.advanceTimersByTime(4000); });
const setReducedMotion = (matches: boolean) => act(() => {
  Object.defineProperty(motion, 'matches', { value: matches, configurable: true });
  for (const listener of listeners) listener({ matches } as MediaQueryListEvent);
});
it('stops rotation immediately when reduced motion is enabled and resumes when disabled', () => {
  render(<MovieCarousel movies={movies} />);
  const initial = active();
  advance();
  expect(active()).not.toBe(initial);
  setReducedMotion(true);
  const stopped = active();
  advance();
  expect(active()).toBe(stopped);
  setReducedMotion(false);
  advance();
  expect(active()).not.toBe(stopped);
});
it('keeps rotation paused when the pointer leaves but keyboard focus remains inside', () => {
  render(<MovieCarousel movies={movies} />);
  const region = screen.getByRole('region', { name: 'Movie carousel' });
  fireEvent.focus(screen.getAllByRole('tab')[0]);
  fireEvent.mouseEnter(region);
  fireEvent.mouseLeave(region);
  const stopped = active();
  advance();
  expect(active()).toBe(stopped);
  fireEvent.blur(screen.getAllByRole('tab')[0], { relatedTarget: document.body });
  advance();
  expect(active()).not.toBe(stopped);
});
it('keeps rotation paused when focus leaves but the pointer remains over the carousel', () => {
  render(<MovieCarousel movies={movies} />);
  const region = screen.getByRole('region', { name: 'Movie carousel' });
  fireEvent.mouseEnter(region);
  fireEvent.focus(screen.getAllByRole('tab')[0]);
  fireEvent.blur(screen.getAllByRole('tab')[0], { relatedTarget: document.body });
  const stopped = active();
  advance();
  expect(active()).toBe(stopped);
});

it('does not rotate when reduced motion is already enabled at mount', () => {
  Object.defineProperty(motion, 'matches', { value: true, configurable: true });
  render(<MovieCarousel movies={movies} />);
  const stopped = active();
  advance();
  expect(active()).toBe(stopped);
});
it('keeps the focus pause while focus moves between carousel controls', () => {
  render(<MovieCarousel movies={movies} />);
  const tabs = screen.getAllByRole('tab');
  fireEvent.focus(tabs[0]);
  fireEvent.blur(tabs[0], { relatedTarget: tabs[1] });
  const stopped = active();
  advance();
  expect(active()).toBe(stopped);
});
