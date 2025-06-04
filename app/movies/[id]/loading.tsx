import React from "react";
import { CardSkeleton, TextSkeleton } from "@/app/components/Skeleton";

const LoadingMovieDetailPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <CardSkeleton />
        </div>
        <div className="md:col-span-2 space-y-6">
          <TextSkeleton lines={4} />
          <div className="grid grid-cols-2 gap-4">
            <TextSkeleton lines={2} />
            <TextSkeleton lines={2} />
          </div>
          <TextSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
};

export default LoadingMovieDetailPage;
