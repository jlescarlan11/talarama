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

// Add revalidation time for ISR
export const revalidate = 60; // Revalidate every 60 seconds

const MovieDetailPage = async ({ params }: Props) => {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  // Split the query into two parts to reduce complexity
  const [movie, reviews] = await Promise.all([
    prisma.movie.findUnique({
      where: { id },
      include: {
        genres: {
          include: {
            genre: true,
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
    }),
    prisma.diaryEntry.findMany({
      where: { movieId: id },
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
      take: 10, // Limit to 10 most recent reviews
    }),
  ]);

  if (!movie) return notFound();

  const movieWithReviews: MovieWithReviews = {
    ...movie,
    genres: movie.genres.map((mg) => mg.genre),
    reviews: reviews,
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
