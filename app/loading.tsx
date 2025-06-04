import React from "react";
import { Skeleton } from "@/app/components";

const HomeLoading = () => {
  return (
    <div className="max-h-screen bg-[#14082b] flex flex-col items-center justify-start pt-12">
      <Skeleton height={80} width={400} className="mb-4" />
      <Skeleton height={32} width={300} className="mb-8" />
      
      {/* Movie Carousel Skeleton */}
      <div className="w-full flex justify-center">
        <div className="movie-carousel-outer flex flex-col items-center w-full">
          <div className="movie-carousel-track flex gap-6 overflow-x-auto px-4 py-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-none w-56 h-80">
                <div className="w-full h-full bg-base-200 rounded-2xl overflow-hidden shadow-lg relative">
                  <Skeleton height="100%" className="rounded-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <Skeleton height={24} width="75%" className="mb-2" />
                    <Skeleton height={20} width="50%" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={12} width={12} circle />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeLoading;
