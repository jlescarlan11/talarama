"use client";

import React from "react";
import Image from "next/image";
import { FiImage } from "react-icons/fi";
import { Movie } from "../types/diary";

interface MoviePreviewProps {
  selectedMovie: Movie | null;
}

const MoviePreview: React.FC<MoviePreviewProps> = ({ selectedMovie }) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
  };

  return (
    <div className="aspect-[2/3] bg-base-300 rounded-lg overflow-hidden border-2 border-dashed border-base-content/20">
      {selectedMovie ? (
        <div className="w-full h-full relative">
          {selectedMovie.posterUrl ? (
            <Image
              width={300}
              height={450}
              src={selectedMovie.posterUrl}
              alt={selectedMovie.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
              <div className="mb-4">
                <FiImage className="w-12 h-12 mx-auto mb-2 text-base-content/40" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {selectedMovie.title}
              </h3>
              <p className="text-sm text-base-content/60 mb-1">
                {selectedMovie.releasedYear}
              </p>
              <p className="text-sm text-base-content/60">
                {formatDuration(selectedMovie.duration)}
              </p>
              {selectedMovie.directorFirstName &&
                selectedMovie.directorLastName && (
                  <p className="text-sm text-base-content/40 mt-2">
                    Dir. {selectedMovie.directorFirstName}{" "}
                    {selectedMovie.directorLastName}
                  </p>
                )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-base-content/40">
          <div className="text-center">
            <FiImage className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Movie Poster</p>
            <p className="text-xs text-base-content/30 mt-1">
              Select a movie to see preview
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePreview;
