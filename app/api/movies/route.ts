import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/client";
import { Genre } from "@prisma/client"; // ✅ Use Prisma type

const currentYear = new Date().getFullYear();

export const createMovieSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().min(1, "Description is required"),
  releasedYear: z
    .number({
      required_error: "Released year is required",
      invalid_type_error: "Released year must be a number",
    })
    .int()
    .min(1800, "Year must be 1800 or later")
    .max(currentYear, `Year cannot be after ${currentYear}`),
  duration: z
    .number({
      required_error: "Duration is required",
      invalid_type_error: "Duration must be a number",
    })
    .int()
    .positive("Duration must be a positive number"),
  posterUrl: z.string().url("Poster URL must be valid").optional(),
  directorFirstName: z
    .string()
    .min(1, "Director's first name is required")
    .max(55),
  directorLastName: z
    .string()
    .min(1, "Director's last name is required")
    .max(55),
  genres: z
    .string()
    .min(1, "At least one genre is required")
    .transform((val) =>
      val
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g.length > 0)
    ),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const validation = createMovieSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(validation.error.format(), { status: 400 });
  }

  const data = validation.data;

  const genres: Genre[] = await Promise.all(
    data.genres.map(async (name: string): Promise<Genre> => {
      let genre = await prisma.genre.findUnique({
        where: { genreName: name },
      });

      if (!genre) {
        genre = await prisma.genre.create({
          data: { genreName: name },
        });
      }

      return genre;
    })
  );

  const newMovie = await prisma.movie.create({
    data: {
      title: data.title,
      description: data.description,
      releasedYear: data.releasedYear,
      duration: data.duration,
      posterUrl: data.posterUrl,
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

  return NextResponse.json(newMovie, { status: 201 });
}
