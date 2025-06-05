// components/movies/EmptyMovieState.tsx
"use client";
import { ReactElement } from "react";

interface EmptyMovieStateProps {
  title?: string;
  description?: string;
  icon?: ReactElement;
}

const EmptyMovieState = ({
  title = "No movies found",
  description = "Try adjusting your search or explore a different filter",
  icon,
}: EmptyMovieStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4">
      <div className="text-6xl mb-6 animate-pulse">{icon || "🎬"}</div>
      <h3 className="text-xl font-bold mb-3 text-base-content">{title}</h3>
      <p className="text-base-content/70 text-center mb-4 max-w-md leading-relaxed">
        {description}
      </p>
      <div className="flex gap-2 mt-2">
        <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

export default EmptyMovieState;
