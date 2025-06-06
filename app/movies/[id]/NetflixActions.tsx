"use client";

// components/NetflixActions.tsx
import { PiNoteBold, PiHeart, PiHeartFill } from "react-icons/pi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

interface Props {
  movieId: string;
  movieTitle: string;
  posterUrl: string | null;
  isLiked: boolean;
  onLikeChange: (isLiked: boolean) => void;
  counts: {
    diaryEntries: number;
    watchedBy: number;
    likedBy: number;
  };
  initialWatchlistStatus: boolean;
}

const NetflixActions = ({
  movieId,
  movieTitle,
  posterUrl,
  isLiked,
  onLikeChange,
  initialWatchlistStatus,
}: Props) => {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const [isInWatchlist, setIsInWatchlist] = useState(initialWatchlistStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogNow = () => {
    const params = new URLSearchParams({
      movieId,
      title: movieTitle,
      ...(posterUrl && { posterUrl }),
    });
    router.push(`/diaries/new?${params.toString()}`);
  };

  const handleWatchlist = async () => {
    if (!sessionData) return;

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

  const handleLike = async () => {
    if (!sessionData) {
      router.push("/api/auth/signin");
      return;
    }

    try {
      setIsLoading(true);
      if (isLiked) {
        await axios.delete(`/api/movies/${movieId}/like`);
      } else {
        await axios.post(`/api/movies/${movieId}/like`);
      }
      onLikeChange(!isLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4  rounded-lg">
      <div className="flex space-x-2">
        {sessionData && (
          <>
            {/* Primary Action */}
            <button
              className="btn bg-primary hover:bg-primary-focus text-primary-content"
              onClick={handleLogNow}
            >
              <PiNoteBold className="text-xl" />
              Log Now
            </button>

            {/* Secondary Actions */}
            <button
              className={`btn ${
                isInWatchlist
                  ? "bg-success text-success-content"
                  : "bg-accent text-accent-content"
              }`}
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
              {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </button>

            <button
              onClick={handleLike}
              disabled={isLoading}
              className="btn btn-circle bg-neutral/10 hover:bg-neutral-focus/10 text-neutral-content"
              aria-label={isLiked ? "Unlike movie" : "Like movie"}
            >
              {isLiked ? (
                <PiHeartFill className="text-2xl text-error " />
              ) : (
                <PiHeart className="text-2xl" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default NetflixActions;
