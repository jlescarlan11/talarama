// components/DiaryEntryViewModal.tsx
"use client";
import React from "react";
import Image from "next/image";
import StarRating from "./StarRating";
import { DiaryEntryWithMovie } from "./types/diary";

interface DiaryEntryViewModalProps {
  entry: DiaryEntryWithMovie;
  onClose: () => void;
}

const DiaryEntryViewModal: React.FC<DiaryEntryViewModalProps> = ({
  entry,
  onClose,
}) => {
  const formatFullDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="modal modal-open" role="dialog">
      <div className="modal-box max-w-2xl">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-base-content">
            Diary Entry Details
          </h3>
        </div>

        <div className="flex gap-6">
          {/* Movie Poster */}
          <div className="flex-shrink-0">
            {entry.movie.posterUrl ? (
              <Image
                height={240}
                width={160}
                src={entry.movie.posterUrl}
                alt={`${entry.movie.title} poster`}
                className="rounded-lg object-cover shadow-lg"
              />
            ) : (
              <div className="w-[160px] h-[240px] bg-base-200 rounded-lg flex items-center justify-center shadow-lg">
                <svg
                  className="w-16 h-16 text-base-content/40"
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
          <div className="flex-1">
            <div className="mb-4">
              <h4 className="text-xl font-semibold text-base-content mb-2">
                {entry.movie.title}
              </h4>
              <div className="flex items-center gap-4 mb-2">
                <StarRating rating={entry.rating} size="md" />
                <span className="text-sm text-base-content/70">
                  {entry.rating}/5
                </span>
              </div>
              <p className="text-sm text-base-content/70">
                Watched on {formatFullDate(entry.watchedDate)}
              </p>
            </div>

            {/* Movie Info */}
            {entry.movie.releasedYear && (
              <div className="mb-4 p-3 bg-base-200 rounded-lg">
                <h5 className="font-medium text-base-content mb-2">
                  Movie Information
                </h5>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Release Year:</span>{" "}
                    {entry.movie.releasedYear}
                  </p>
                </div>
              </div>
            )}

            {/* Review */}
            {entry.review && (
              <div>
                <h5 className="font-medium text-base-content mb-2">
                  My Review
                </h5>
                <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                  <p className="text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">
                    {entry.review}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-action">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default DiaryEntryViewModal;
