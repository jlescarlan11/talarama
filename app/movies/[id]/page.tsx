import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import EditMovieButton from "./EditMovieButton";
import MovieDetails from "./MovieDetails";
import DeleteMovieButton from "./DeleteMovieButton";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";

interface Props {
  params: { id: string };
}

const MovieDetailPage = async ({ params }: Props) => {
  const session = await getServerSession(authOptions);

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
        <MovieDetails movie={movie} />
      </div>
      {session && (
        <div className="card">
          <EditMovieButton movieId={movie.id} />

          <DeleteMovieButton movieId={movie.id} />
        </div>
      )}
    </div>
  );
};

export default MovieDetailPage;
