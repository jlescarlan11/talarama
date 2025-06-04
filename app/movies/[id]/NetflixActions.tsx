"use client";

// components/NetflixActions.tsx
import { Session } from "next-auth";
import { PiNoteBold } from "react-icons/pi";
import { MovieCounts } from "./types";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Props {
  movieId: string;
  session: Session | null;
  counts: MovieCounts;
  movieTitle: string;
  posterUrl: string | null;
}

const NetflixActions = ({ movieId, session, counts, movieTitle, posterUrl }: Props) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [likeCount, setLikeCount] = useState(counts.likedBy);

  // Check initial state when component mounts
  useEffect(() => {
    const checkInitialState = async () => {
      if (!session) return;

      try {
        // Check if movie is liked
        const likeResponse = await fetch(`/api/movies/${movieId}/like`);
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setIsLiked(likeData.liked);
        }

        // Check if movie is in watchlist
        const watchlistResponse = await fetch(`/api/movies/${movieId}/watchlist`);
        if (watchlistResponse.ok) {
          const watchlistData = await watchlistResponse.json();
          setIsInWatchlist(watchlistData.inWatchlist);
        }
      } catch (error) {
        console.error("Error checking initial state:", error);
      }
    };

    checkInitialState();
  }, [movieId, session]);

  const handleLogNow = () => {
    const params = new URLSearchParams({
      movieId,
      title: movieTitle,
      ...(posterUrl && { posterUrl })
    });
    router.push(`/diaries/new?${params.toString()}`);
  };

  const handleLike = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/movies/${movieId}/like`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to toggle like");

      const data = await response.json();
      setIsLiked(data.liked);
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleWatchlist = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/movies/${movieId}/watchlist`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to toggle watchlist");

      const data = await response.json();
      setIsInWatchlist(data.inWatchlist);
    } catch (error) {
      console.error("Error toggling watchlist:", error);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-2">
        {session && (
          <>
            {/* Primary Action */}
            <button className="btn btn-primary" onClick={handleLogNow}>
              <PiNoteBold className="text-xl" />
              Log Now
            </button>

            {/* Secondary Actions */}
            <button 
              className={`btn ${isInWatchlist ? 'btn-success' : 'btn-accent'}`}
              onClick={handleWatchlist}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </button>

            <button 
              className={`btn ${isLiked ? 'btn-error' : 'btn-secondary'}`}
              onClick={handleLike}
            >
              <svg
                className="w-5 h-5"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {isLiked ? 'Unlike' : 'Like'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default NetflixActions;
