import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import React from "react";
import MovieForm from "../../_components/MovieForm";

interface Props {
  params: Promise<{ id: string }>;
}

const EditMoviePage = async ({ params }: Props) => {
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

  if (!movie) notFound();

  return <MovieForm movie={movie} />;
};

export default EditMoviePage;
