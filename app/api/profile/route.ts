import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";
import prisma from "@/prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  try {
    // Get user's liked movies
    const likedMovies = await prisma.movie.findMany({
      where: {
        likedBy: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        diaryEntries: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    // Get user's diary entries for stats
    const diaryEntries = await prisma.diaryEntry.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        movie: {
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
          },
        },
      },
    });

    // Calculate stats
    const totalMovies = diaryEntries.length;
    const averageRating = diaryEntries.length > 0
      ? diaryEntries.reduce((acc, entry) => acc + entry.rating, 0) / diaryEntries.length
      : 0;

    // Calculate favorite genre
    const genreCounts = diaryEntries.reduce((acc, entry) => {
      entry.movie.genres.forEach(({ genre }) => {
        acc[genre.genreName] = (acc[genre.genreName] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const favoriteGenre = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || "None";

    // Calculate total watch time (assuming average movie duration of 2 hours)
    const watchTime = totalMovies * 2;

    const stats = {
      totalMovies,
      averageRating: Number(averageRating.toFixed(1)),
      favoriteGenre,
      watchTime: `${watchTime} hours`,
    };

    return NextResponse.json({
      likedMovies: likedMovies.map(movie => ({
        id: movie.id,
        title: movie.title,
        year: movie.releasedYear,
        rating: movie.diaryEntries[0]?.rating || 0,
      })),
      stats,
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 