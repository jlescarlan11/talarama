"use client";

import React from "react";
import { FaStar } from "react-icons/fa";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  error?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  error,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="space-y-2">
      <label className="label">
        <span className="label-text font-semibold">Rating</span>
      </label>
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} out of 5`}
            aria-pressed={star === rating}
            className={`min-h-11 min-w-11 inline-flex items-center justify-center transition-colors hover:scale-110 transform ${
              star <= (hoverRating || rating)
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <FaStar size={20} />
          </button>
        ))}
      </div>
      {error && <div className="text-error text-sm">{error}</div>}
    </div>
  );
};

export default StarRating;
