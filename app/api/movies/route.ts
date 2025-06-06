import prisma from "@/prisma/client";
import { Genre } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { movieSchema } from "@/app/validationSchemas";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";

// Add caching headers
const CACHE_CONTROL = {
  GET: "public, s-maxage=60, stale-while-revalidate=300", // Cache for 1 minute, stale for 5 minutes
  POST: "no-store", // Don't cache POST requests
};

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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({}, { 
    status: 401,
    headers: {
      "Cache-Control": CACHE_CONTROL.POST,
    },
  });

  try {
    const body = await request.json();
    const validation = movieSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const data = validation.data;
    const genreNames = data.genres.map((g: string) => g.trim());

    // Use transaction to ensure data consistency
    const newMovie = await prisma.$transaction(async (tx) => {
      const genres: Genre[] = await Promise.all(
        genreNames.map(async (name: string): Promise<Genre> => {
          let genre = await tx.genre.findUnique({
            where: { genreName: name },
          });

          if (!genre) {
            genre = await tx.genre.create({
              data: { genreName: name },
            });
          }

          return genre;
        })
      );

      return tx.movie.create({
        data: {
          title: data.title,
          description: data.description,
          releasedYear: data.releasedYear,
          duration: data.duration,
          posterUrl: data.posterUrl ?? null,
          directorFirstName: data.directorFirstName,
          directorLastName: data.directorLastName,
          genres: {
            create: genres.map((genre) => ({
              genre: {
                connect: { id: genre.id },
              },
            })),
          },
        },
        include: {
          genres: {
            include: { genre: true },
          },
        },
      });
    });

    return NextResponse.json(newMovie, { status: 201 });
  } catch (error) {
    console.error("Error creating movie:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
