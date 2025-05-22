import prisma from "@/prisma/client";
import Image from "next/image";
import { notFound } from "next/navigation";
import React from "react";
import MovieDetailActions from "./MovieDetailActions";

interface Props {
  params: { id: string };
}

const MovieDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
    },
  });

  if (!movie) return notFound();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="card">
        <p>{movie.title}</p>
        <p>{movie.description}</p>
        <p>{movie.releasedYear}</p>
        <p>{movie.duration}</p>
        <Image
          src={movie.posterUrl ?? "/placeholder.png"}
          height={200}
          width={200}
          alt="image"
        />
        <p>
          {movie.directorFirstName} {movie.directorLastName}
        </p>
        <p>{movie.genres.map((mg) => mg.genre.genreName).join(", ")}</p>
      </div>
      <div className="card">
        <MovieDetailActions movie={movie} />
      </div>
    </div>
  );
};

export default MovieDetailPage;
