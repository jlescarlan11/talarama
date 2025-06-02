// components/movies/MovieSkeletons.tsx
export const MovieFiltersSkeleton = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50 p-4 rounded-lg animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        {/* Genre Filter Skeleton */}
        <div className="flex flex-col gap-1">
          <div className="h-4 w-12 bg-gray-300 rounded"></div>
          <div className="h-10 w-32 bg-gray-300 rounded-md"></div>
        </div>

        {/* Sort Filter Skeleton */}
        <div className="flex flex-col gap-1">
          <div className="h-4 w-16 bg-gray-300 rounded"></div>
          <div className="h-10 w-40 bg-gray-300 rounded-md"></div>
        </div>
      </div>
    </div>
  );
};

// components/movies/MovieListSkeleton.tsx
export const MovieListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-gray-300 aspect-[2/3] rounded-lg mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
