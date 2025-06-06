import prisma from "@/prisma/client";
import DiaryForm from "../_components/DiaryForm";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    movieId?: string;
    title?: string;
    posterUrl?: string;
  }>;
}

const DiaryPage = async ({ searchParams }: Props) => {
  const { movieId, title, posterUrl } = await searchParams;

  const movies = await prisma.movie.findMany({
    orderBy: {
      title: "asc",
    },
  });

  // If movieId is provided, find the movie in the database
  let initialMovie = null;
  if (movieId) {
    initialMovie = movies.find((movie) => movie.id === movieId);
  }

  // If movie not found in database but we have title and posterUrl from URL
  if (!initialMovie && title) {
    initialMovie = {
      id: movieId || "",
      title,
      posterUrl: posterUrl || null,
      description: null,
      releasedYear: 0,
      duration: 0,
      directorFirstName: null,
      directorLastName: null,
      createdAt: new Date(),
    };
  }

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
            <li>New Entry</li>
          </ul>
        </div>
      </div>
      <DiaryForm movies={movies} initialMovie={initialMovie} />
    </>
  );
};

export default DiaryPage;
