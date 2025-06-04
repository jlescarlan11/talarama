import authOptions from "@/app/auth/authOptions";
import prisma from "@/prisma/client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import MovieReviews from "./MovieReviews";
import NetflixHero from "./NetflixHero";
import { MovieWithReviews } from "./types";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
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
      diaryEntries: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          watchedBy: true,
          likedBy: true,
          diaryEntries: true,
        },
      },
    },
  });

  if (!movie) return notFound();

  const movieWithReviews: MovieWithReviews = {
    ...movie,
    genres: movie.genres.map((mg) => mg.genre),
    reviews: movie.diaryEntries,
  };

  return (
    <div className="">
      <div className="mb-6">
        <div className="text-sm breadcrumbs">
          <ul>
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/movies" className="hover:underline">
                Movies
              </Link>
            </li>
            <li>{movie.title}</li>
          </ul>
        </div>
      </div>
      {/* Netflix-style Hero */}
      <NetflixHero
        movie={movieWithReviews}
        counts={movie._count}
        session={session}
      />

      {/* Reviews Section */}
      <div className="">
        <MovieReviews reviews={movieWithReviews.reviews} />
      </div>
    </div>
  );
};

export default MovieDetailPage;
