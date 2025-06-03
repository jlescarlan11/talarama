"use client";
// components/DiaryEntryCard.tsx
import React from "react";
import Image from "next/image";
import StarRating from "./StarRating";
import { DiaryEntryWithMovie } from "./types/diary";

interface DiaryEntryCardProps {
  diaryEntry: DiaryEntryWithMovie;
  showFullDate?: boolean;
}

const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({
  diaryEntry,
  showFullDate = false,
}) => {
  const formatDate = (date: Date): string => {
    if (showFullDate) {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date(date));
    }
    return new Date(date).getDate().toString();
  };

  const truncateReview = (review: string, maxLength: number = 120): string => {
    return review.length > maxLength
      ? review.substring(0, maxLength) + "..."
      : review;
  };

  return (
    <div className="grid grid-cols-10">
      {/* Date Column */}
      <div className="flex-shrink-0 col-span-2">
        <div className=" text-2xl font-bold text-primary">
          {formatDate(diaryEntry.watchedDate)}
        </div>
      </div>

      {/* Movie Poster */}
      <div className="flex-shrink-0 flex space-x-4 col-span-4">
        <div className="">
          {diaryEntry.movie.posterUrl ? (
            <Image
              height={80}
              width={60}
              src={diaryEntry.movie.posterUrl}
              alt={`${diaryEntry.movie.title} poster`}
              className="rounded-md object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-[60px] h-[80px] bg-base-200 rounded-md flex items-center justify-center">
              <svg
                className="w-8 h-8 text-base-content/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-grow min-w-0">
          <div className="mb-2">
            <h3 className="font-semibold text-lg text-base-content leading-tight">
              {diaryEntry.movie.title}
            </h3>
            <div className="mt-1">
              <StarRating rating={diaryEntry.rating} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Movie Details */}

      <div className="col-span-4">
        {diaryEntry.review && (
          <div className="mt-3">
            <p className="text-sm text-base-content/70 leading-relaxed">
              {truncateReview(diaryEntry.review)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryEntryCard;
