import prisma from "@/prisma/client";
import { Genre } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { movieSchema } from "@/app/validationSchemas";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({}, { status: 401 });

  try {
    const body = await request.json();

    const validation = movieSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const data = validation.data;

    // Normalize genre names (trim)
    const genreNames = data.genres.map((g: string) => g.trim());

    const genres: Genre[] = await Promise.all(
      genreNames.map(async (name: string): Promise<Genre> => {
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
        duration: parseInt(data.duration),
        posterUrl: data.posterUrl ?? null,
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
  } catch (error) {
    console.error("Error creating movie:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
