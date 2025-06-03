// components/StarRating.tsx
"use client";
import React from "react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "xs" | "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
}) => {
  const getSizeClass = () => {
    switch (size) {
      case "xs":
        return "w-3 h-3";
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-5 h-5";
      case "lg":
        return "w-6 h-6";
      default:
        return "w-5 h-5";
    }
  };

  const getContainerClass = () => {
    switch (size) {
      case "xs":
        return "gap-0.5";
      case "sm":
        return "gap-1";
      case "md":
        return "gap-1";
      case "lg":
        return "gap-1.5";
      default:
        return "gap-1";
    }
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className={`flex items-center ${getContainerClass()}`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        const isHalfFilled =
          starValue === Math.ceil(rating) && rating % 1 !== 0;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(starValue)}
            disabled={!interactive}
            className={`
              ${getSizeClass()} 
              ${
                interactive
                  ? "cursor-pointer hover:scale-110"
                  : "cursor-default"
              }
              transition-all duration-150 ease-in-out
              ${interactive ? "hover:text-warning" : ""}
              disabled:cursor-default
            `}
            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
          >
            {isHalfFilled ? (
              <svg
                className={`${getSizeClass()} text-warning`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <defs>
                  <linearGradient id={`half-${index}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#half-${index})`}
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            ) : (
              <svg
                className={`${getSizeClass()} ${
                  isFilled ? "text-warning" : "text-base-300"
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
