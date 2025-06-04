// app/api/diary/[id]/route.ts

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import authOptions from "@/app/auth/authOptions";
import { diaryEntrySchema } from "@/app/validationSchemas";
import prisma from "@/prisma/client";

export const runtime = "edge"; // Explicitly opt into Edge runtime

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Validate diary entry exists and belongs to user
    const existingEntry = await prisma.diaryEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Diary entry not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = diaryEntrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { movieId, rating, review, watchedDate } = validation.data;

    // Verify movie exists if movieId is being updated
    if (movieId !== existingEntry.movieId) {
      const movieExists = await prisma.movie.findUnique({
        where: { id: movieId },
      });

      if (!movieExists) {
        return NextResponse.json({ error: "Movie not found" }, { status: 400 });
      }
    }

    const updatedEntry = await prisma.diaryEntry.update({
      where: { id },
      data: {
        movieId,
        rating,
        review: review?.trim(), // Safe navigation in case review is undefined
        watchedDate: new Date(watchedDate),
        updatedAt: new Date(),
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

    return NextResponse.json(updatedEntry, { status: 200 });
  } catch (error) {
    console.error("Error updating diary entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Verify diary entry exists and belongs to user
    const diaryEntry = await prisma.diaryEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!diaryEntry) {
      return NextResponse.json(
        { error: "Diary entry not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.diaryEntry.delete({
      where: { id: diaryEntry.id },
    });

    return NextResponse.json({ message: "Diary entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
