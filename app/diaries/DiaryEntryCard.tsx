"use client";
// components/DiaryEntryCard.tsx
import Image from "next/image";
import React from "react";
import { PiHeartFill } from "react-icons/pi";
import DiaryEntryMenu from "./DiaryEntryMenu";
import StarRating from "./StarRating";
import { DiaryEntryWithMovie } from "./types/diary";

interface DiaryEntryCardProps {
  diaryEntry: DiaryEntryWithMovie;
  showFullDate?: boolean;
  onView?: (entry: DiaryEntryWithMovie) => void;
  onEdit?: (entry: DiaryEntryWithMovie) => void;
  onDelete?: (entry: DiaryEntryWithMovie) => void;
}

const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({
  diaryEntry,
  onView,
  onEdit,
  onDelete,
}) => {
  const truncateReview = (review: string, maxLength: number = 120): string => {
    return review.length > maxLength
      ? review.substring(0, maxLength) + "..."
      : review;
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4 bg-base-300/20 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-md">
      {/* Movie Poster */}
      <div className="flex-shrink-0">
        {diaryEntry.movie.posterUrl ? (
          <Image
            height={80}
            width={60}
            src={diaryEntry.movie.posterUrl}
            alt={`${diaryEntry.movie.title} poster`}
            className="rounded-lg object-cover shadow-lg w-[50px] h-[70px] sm:w-[60px] sm:h-[80px]"
            loading="lazy"
          />
        ) : (
          <div className="w-[50px] h-[70px] sm:w-[60px] sm:h-[80px] bg-base-200 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-base-content/40"
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
      {/* Movie Details */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
          <h3 className="font-semibold text-base sm:text-lg text-white leading-tight truncate">
            {diaryEntry.movie.title}
          </h3>
          <PiHeartFill className="text-accent text-lg sm:text-xl ml-1 sm:ml-2" />
        </div>
        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
          <StarRating rating={diaryEntry.rating} size="sm" />
        </div>
        {diaryEntry.review && (
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed truncate">
            {truncateReview(diaryEntry.review)}
          </p>
        )}
      </div>
      {/* Menu Column */}
      <div className="flex-shrink-0 flex justify-end">
        <DiaryEntryMenu
          diaryEntry={diaryEntry}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default DiaryEntryCard;
