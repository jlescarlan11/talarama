"use client";

// components/NetflixActions.tsx
import { Session } from "next-auth";
import { PiNoteBold } from "react-icons/pi";
import { MovieCounts } from "./types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  movieId: string;
  session: Session | null;
  counts: MovieCounts;
}

const NetflixActions = ({ movieId, session, counts }: Props) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(counts.likedBy);
  const [inWatchlist, setInWatchlist] = useState(false);

  const handleLogNow = () => {
    router.push(`/diaries/new?movieId=${movieId}`);
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
      setInWatchlist(data.inWatchlist);
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
              className={`btn ${inWatchlist ? 'btn-success' : 'btn-accent'}`}
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
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
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

      {/* Stats */}
      <div className="flex items-center gap-6 ">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          {counts.watchedBy}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
          {likeCount}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          {counts.diaryEntries}
        </span>
      </div>
    </div>
  );
};

export default NetflixActions;
