import { diaryEntrySchema } from "@/app/validationSchemas";
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({}, { status: 401 });

  try {
    const body = await request.json();
    console.log(body);

    const validation = diaryEntrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const data = validation.data;

    const newDiaryEntry = await prisma.diaryEntry.create({
      data: {
        review: data.review,
        rating: data.rating,
        movieId: data.movieId,
        userId: session!.user.id,
      },
    });

    return NextResponse.json(newDiaryEntry, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
