import React from "react";
import { CardSkeleton, TextSkeleton } from "@/app/components/Skeleton";
import { Skeleton } from "@/app/components";

const LoadingMovieDetailPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative h-[60vh] mb-8 rounded-2xl overflow-hidden">
        <Skeleton height="100%" className="rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <Skeleton height={48} width={300} className="mb-4" />
          <div className="flex gap-4 mb-4">
            <Skeleton height={32} width={100} />
            <Skeleton height={32} width={100} />
            <Skeleton height={32} width={100} />
          </div>
          <Skeleton height={24} width="75%" />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Movie Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <Skeleton height={32} width={200} className="mb-4" />
              <TextSkeleton lines={4} />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Skeleton height={20} width={100} className="mb-2" />
                  <Skeleton height={24} width={150} />
                </div>
                <div>
                  <Skeleton height={20} width={100} className="mb-2" />
                  <Skeleton height={24} width={150} />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <Skeleton height={32} width={150} className="mb-6" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton height={40} width={40} circle />
                    <div>
                      <Skeleton height={20} width={150} className="mb-2" />
                      <Skeleton height={16} width={100} />
                    </div>
                  </div>
                  <TextSkeleton lines={2} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="md:col-span-1">
          <div className="card bg-base-200 shadow-xl sticky top-6">
            <div className="card-body">
              <Skeleton height={32} width={150} className="mb-4" />
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden mb-4">
                <Skeleton height="100%" className="rounded-lg" />
              </div>
              <div className="space-y-4">
                <div>
                  <Skeleton height={20} width={100} className="mb-2" />
                  <Skeleton height={24} width="100%" />
                </div>
                <div>
                  <Skeleton height={20} width={100} className="mb-2" />
                  <Skeleton height={24} width="100%" />
                </div>
                <div>
                  <Skeleton height={20} width={100} className="mb-2" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} height={32} width={80} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingMovieDetailPage;
