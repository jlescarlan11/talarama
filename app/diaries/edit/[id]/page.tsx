import React from "react";
import DiaryForm from "../../_components/DiaryForm";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";

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
  
  return (
    <>
      <div className="mb-6">
        <div className="text-sm breadcrumbs">
          <ul>
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/diaries" className="hover:underline">
                Diary
              </Link>
            </li>
            <li>Edit Entry</li>
          </ul>
        </div>
      </div>
      <DiaryForm movies={movies} diary={diaryEntry} />
    </>
  );
};

export default EditDiaryPage;
