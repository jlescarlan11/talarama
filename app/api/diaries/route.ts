import { diaryEntrySchema } from "@/app/validationSchemas";
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";

export async function POST(request: NextRequest) {
  const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return json({ error: "Unauthorized" }, 401);

  let body: unknown;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  const validation = diaryEntrySchema.safeParse(body);
  if (!validation.success) return json({ error: "Validation failed", details: validation.error.format() }, 400);

  try {
    const data = validation.data;
    const movie = await prisma.movie.findUnique({ where: { id: data.movieId }, select: { id: true } });
    if (!movie) return json({ error: "Movie not found" }, 404);
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
    if (!user) return json({ error: "User not found" }, 404);

    const entry = await prisma.diaryEntry.create({ data: {
      movieId: data.movieId, userId: session.user.id, rating: data.rating,
      review: data.review, watchedDate: new Date(data.watchedDate),
    } });
    return json(entry, 201);
  } catch {
    // Raw Prisma errors can contain query arguments and private review text.
    console.error("Diary creation failed");
    return json({ error: "Internal Server Error" }, 500);
  }
}
