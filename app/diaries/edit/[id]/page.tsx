import React from "react";
import DiaryForm from "../../_components/DiaryForm";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

const EditDiaryPage = async ({ params }: Props) => {
  const { id } = await params;

  const movies = await prisma.movie.findMany();
  const diaryEntry = await prisma.diaryEntry.findUnique({
    where: { id },
    include: {
      movie: true,
    },
  });

  if (!diaryEntry) notFound();
  return <DiaryForm movies={movies} diary={diaryEntry} />;
};

export default EditDiaryPage;
