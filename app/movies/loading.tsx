import React from "react";
import { Skeleton } from "@/app/components";

const MoviesLoading = () => {
  return (
    <div className="container max-w-7xl mx-auto pb-12">
      {/* Header with breadcrumb navigation */}
      <div className="mb-4">
        <div className="mb-6">
          <div className="text-sm breadcrumbs">
            <ul>
              <li>
                <Skeleton height={16} width={40} />
              </li>
              <li>
                <Skeleton height={16} width={60} />
              </li>
            </ul>
          </div>
        </div>

        <Skeleton height={36} width={200} className="mb-2" />
        <Skeleton height={20} width={400} className="mb-8" />
      </div>

      {/* Main Content */}
      <div className="w-full mb-6">
        <div className="flex flex-col gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton height={48} width="100%" className="sm:w-96" />
            <Skeleton height={48} width="100%" className="sm:w-48" />
          </div>

          {/* Count display */}
          <div className="flex justify-between items-center">
            <Skeleton height={20} width={200} />
          </div>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] relative rounded-lg overflow-hidden">
            <Skeleton height="100%" className="rounded-lg" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <Skeleton height={16} width="75%" className="mb-2" />
              <Skeleton height={14} width="50%" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-4 mt-12 text-base-content border-t border-base-300">
        <div>
          <Skeleton height={16} width={300} />
        </div>
      </footer>
    </div>
  );
};

export default MoviesLoading; 