import authOptions from '@/app/auth/authOptions';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { retiredCatalogWrite } from '@/app/lib/movies/library-handler';
export async function PATCH() { return retiredCatalogWrite(); }
export async function DELETE() { return retiredCatalogWrite(); }
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: movieId } = await params;

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        likedBy: session ? {
          where: {
            userId: session.user.id,
          },
        } : false,
        _count: {
          select: {
            likedBy: true,
          },
        },
      },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json(movie);
  } catch (error) {
    console.error("Error fetching movie:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
