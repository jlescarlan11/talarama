import prisma from "@/prisma/client";
import delay from "delay";
import { notFound } from "next/navigation";
import React from "react";

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

  await delay(2000);
  if (!movie) return notFound();

  return (
    <div>
      <p>{movie.title}</p>
      <p>{movie.description}</p>
      <p>{movie.releasedYear}</p>
      <p>{movie.duration}</p>
      <p>
        {movie.directorFirstName} {movie.directorLastName}
      </p>
      <p>{movie.genres.map((mg) => mg.genre.genreName).join(", ")}</p>
    </div>
  );
};

export default MovieDetailPage;
