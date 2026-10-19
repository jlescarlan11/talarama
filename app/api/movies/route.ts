import prisma from '@/prisma/client';
import { NextResponse } from 'next/server';
import { retiredCatalogWrite } from '@/app/lib/movies/library-handler';
const CACHE_CONTROL = { GET: 'public, s-maxage=60, stale-while-revalidate=300' };
export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        _count: {
          select: {
            watchedBy: true,
            likedBy: true,
            diaryEntries: true,
          },
        },
      },
      take: 20, // Limit to 20 movies per request
    });

    return NextResponse.json(movies, {
      status: 200,
      headers: {
        "Cache-Control": CACHE_CONTROL.GET,
      },
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function POST() { return retiredCatalogWrite(); }
