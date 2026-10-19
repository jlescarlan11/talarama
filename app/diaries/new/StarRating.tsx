"use client";

import React from "react";
import { FaStar } from "react-icons/fa";

interface StarRatingProps {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  error?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  error,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <fieldset className="space-y-2">
      <legend className="label">
        <span className="label-text font-semibold">Rating</span>
      </legend>
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} out of 5`}
            aria-pressed={star === rating}
            className={`min-h-11 min-w-11 inline-flex items-center justify-center transition-colors hover:scale-110 transform ${
              star <= (hoverRating || rating || 0)
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
      <button type="button" className="btn btn-sm btn-outline" aria-pressed={rating === null} onClick={() => onRatingChange(null)}>No rating</button>
      {error && <div className="text-error text-sm">{error}</div>}
    </fieldset>
  );
};

export default StarRating;
