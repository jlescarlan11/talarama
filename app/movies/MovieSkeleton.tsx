// components/movies/MovieSkeletons.tsx
export const MovieFiltersSkeleton = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50 p-4 rounded-lg animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        {/* Genre Filter Skeleton */}
        <div className="flex flex-col gap-1">
          <div className="h-4 w-12 bg-base-100 rounded"></div>
          <div className="h-10 w-32 bg-base-100 rounded-md"></div>
        </div>

        {/* Sort Filter Skeleton */}
        <div className="flex flex-col gap-1">
          <div className="h-4 w-16 bg-base-100 rounded"></div>
          <div className="h-10 w-40 bg-base-100 rounded-md"></div>
        </div>
      </div>
    </div>
  );
};

// components/movies/MovieListSkeleton.tsx
export const MovieListSkeleton = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="group aspect-[2/3] rounded-lg overflow-hidden relative cursor-pointer shadow-md"
        >
          {/* Poster Skeleton */}
          <div className="absolute inset-0 bg-base-100 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
          </div>

          {/* Base overlay - always visible but subtle */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Hover overlay - enhanced on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Rating badge skeleton - only visible on hover */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="h-6 w-16 bg-base-100 rounded-full animate-pulse"></div>
          </div>

          {/* Movie details skeleton - only visible on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="text-center space-y-2">
              {/* Title */}
              <div className="h-4 bg-base-100 rounded w-3/4 mx-auto animate-pulse"></div>

              {/* Year */}
              <div className="h-3 bg-base-100 rounded w-12 mx-auto animate-pulse"></div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                <div className="h-5 bg-base-100 rounded-full w-16 animate-pulse"></div>
                <div className="h-5 bg-base-100 rounded-full w-14 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Subtle title overlay for non-hover state */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white group-hover:opacity-0 transition-opacity duration-300">
            <div className="text-center">
              <div className="h-3 bg-base-100 rounded w-2/3 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
