import prisma from "@/prisma/client";
import DiaryForm from "../_components/DiaryForm";

interface Props {
  searchParams: {
    movieId?: string;
    title?: string;
    posterUrl?: string;
  };
}

const DiaryPage = async ({ searchParams }: Props) => {
  const { movieId, title, posterUrl } = searchParams;

  const movies = await prisma.movie.findMany({
    orderBy: {
      title: "asc",
    },
  });

  // If movieId is provided, find the movie in the database
  let initialMovie = null;
  if (movieId) {
    initialMovie = movies.find(movie => movie.id === movieId);
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

  return <DiaryForm movies={movies} initialMovie={initialMovie} />;
};

export default DiaryPage;
