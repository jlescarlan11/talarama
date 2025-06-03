import authOptions from "@/app/auth/authOptions";
import { diarySchema } from "@/app/validationSchemas";
import prisma from "@/prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({}, { status: 401 });

  const { id } = params;

  try {
    const body = await request.json();
    const validation = diarySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const data = validation.data;

    const updatedDiary = await prisma.diary.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        date: data.date,
        // Add other diary fields as needed
      },
    });

    return NextResponse.json(updatedDiary, { status:200 });
  } catch (error) {
    console.error("Error updating diary:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id } = params;
  const diary = await prisma.diaryEntry.findUnique({
    where: { id },
  });

  if (!diary)
    return NextResponse.json({ error: "Invalid Diary" }, { status: 404 });

  await prisma.diaryEntry.delete({
    where: { id: diary.id },
  });

  return NextResponse.json({});
}