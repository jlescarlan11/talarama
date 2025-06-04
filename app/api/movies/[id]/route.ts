import authOptions from "@/app/auth/authOptions";
import { movieSchema } from "@/app/validationSchemas";
import prisma from "@/prisma/client";
import { Genre } from "@prisma/client";
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
    const validation = movieSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const data = validation.data;

    // Normalize and ensure genre existence
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

    const updatedMovie = await prisma.movie.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        releasedYear: data.releasedYear,
        duration: data.duration,
        posterUrl: data.posterUrl ?? null,
        directorFirstName: data.directorFirstName,
        directorLastName: data.directorLastName,
        genres: {
          // Reset genres to only those in the update payload
          deleteMany: {},
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

    return NextResponse.json(updatedMovie, { status: 200 });
  } catch (error) {
    console.error("Error updating movie:", error);
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
  const movie = await prisma.movie.findUnique({
    where: { id },
  });

  if (!movie)
    return NextResponse.json({ error: "Invalid Movie" }, { status: 404 });

  await prisma.movie.delete({
    where: { id: movie.id },
  });

  return NextResponse.json({});
}
