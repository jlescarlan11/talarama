import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/client";

const currentYear = new Date().getFullYear();

const createMovieSchema = z.object({
  title: z.string().min(1).max(255),
  releasedYear: z.number().min(1800).max(currentYear),
  description: z.string().min(1),
  posterUrl: z.string().url().optional(),
  directorName: z.string().min(1).max(55),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const validation = createMovieSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(validation.error.format, { status: 400 });
  }

  const newMovie = await prisma.movie.create({
    data: {
      title: body.title,
      description: body.description,
      releasedYear: body.releasedYear,
      posterUrl: body.posterUrl,
      directorName: body.directorName,
    },
  });

  return NextResponse.json(newMovie, { status: 201 });
}
