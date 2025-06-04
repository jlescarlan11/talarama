import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";
import prisma from "@/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id: movieId } = await params;
  const userId = session.user.id;

  try {
    const existingWatchlist = await prisma.watchedList.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    return NextResponse.json({ inWatchlist: !!existingWatchlist });
  } catch (error) {
    console.error("Error checking watchlist status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id: movieId } = await params;
  const userId = session.user.id;

  try {
    // Check if the movie is already in the watchlist
    const existingWatchlist = await prisma.watchedList.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    if (existingWatchlist) {
      // Remove from watchlist
      await prisma.watchedList.delete({
        where: {
          movieId_userId: {
            movieId,
            userId,
          },
        },
      });
      return NextResponse.json({ inWatchlist: false });
    }

    // Add to watchlist
    await prisma.watchedList.create({
      data: {
        movieId,
        userId,
      },
    });

    return NextResponse.json({ inWatchlist: true });
  } catch (error) {
    console.error("Error toggling watchlist:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 