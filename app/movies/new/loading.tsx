import React from "react";
import { Skeleton } from "@/app/components";

const NewMovieLoading = () => {
  return (
    <div className="container max-w-3xl mx-auto p-4">
      <div className="mb-8">
        <Skeleton height={40} width={200} className="mb-4" />
        <Skeleton height={24} width={300} />
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <Skeleton height={24} width={150} className="mb-4" />
            <div className="space-y-4">
              <div>
                <Skeleton height={20} width={100} className="mb-2" />
                <Skeleton height={48} width="100%" />
              </div>
              <div>
                <Skeleton height={20} width={100} className="mb-2" />
                <Skeleton height={48} width="100%" />
              </div>
              <div>
                <Skeleton height={20} width={100} className="mb-2" />
                <Skeleton height={48} width="100%" />
              </div>
            </div>
          </div>
        </div>

        {/* Movie Details */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <Skeleton height={24} width={150} className="mb-4" />
            <div className="space-y-4">
              <div>
                <Skeleton height={20} width={100} className="mb-2" />
                <Skeleton height={48} width="100%" />
              </div>
              <div>
                <Skeleton height={20} width={100} className="mb-2" />
                <Skeleton height={48} width="100%" />
              </div>
              <div>
                <Skeleton height={20} width={100} className="mb-2" />
                <Skeleton height={200} width="100%" />
              </div>
            </div>
          </div>
        </div>

        {/* Genres */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <Skeleton height={24} width={100} className="mb-4" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={32} width={100} />
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Skeleton height={48} width={120} />
        </div>
      </div>
    </div>
  );
};

export default NewMovieLoading;
