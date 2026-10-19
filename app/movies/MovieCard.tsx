"use client";
import type { Movie } from '@prisma/client';
import CatalogCard from './CatalogCard';
import { normalizeLocalMovie } from '@/app/lib/tmdb/normalize';
export default function MovieCard({ movie }: { movie: Movie }) {
 return <CatalogCard movie={normalizeLocalMovie(movie)} />;
}
