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
    const existingLike = await prisma.likedBy.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    return NextResponse.json({ liked: !!existingLike });
  } catch (error) {
    console.error("Error checking like status:", error);
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
    // Check if the like already exists
    const existingLike = await prisma.likedBy.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the movie
      await prisma.likedBy.delete({
        where: {
          movieId_userId: {
            movieId,
            userId,
          },
        },
      });
      return NextResponse.json({ liked: false });
    }

    // Like the movie
    await prisma.likedBy.create({
      data: {
        movieId,
        userId,
      },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id: movieId } = await params;
  const userId = session.user.id;

  try {
    // Check if the like exists
    const existingLike = await prisma.likedBy.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json({ liked: false });
    }

    // Unlike the movie
    await prisma.likedBy.delete({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    return NextResponse.json({ liked: false });
  } catch (error) {
    console.error("Error unliking movie:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 