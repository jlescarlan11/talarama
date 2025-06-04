// components/MovieReviews.tsx
import Image from "next/image";
import { Review } from "./types";

interface Props {
  reviews: Review[];
}

const MovieReviews = ({ reviews }: Props) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  if (reviews.length === 0) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8 ">Reviews</h2>
        <div className="text-center py-16 text-white/60">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-lg">No reviews yet</p>
          <p className="text-sm">Be the first to share your thoughts!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>
      </div>

      <div className="space-y-2">
        {reviews.map((review) => (
          <div
            key={review.id}
            className=" border-t border-base-200 rounded-lg p-6 backdrop-blur-sm"
          >
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {review.user.image ? (
                  <Image
                    src={review.user.image}
                    alt={review.user.name || "User"}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {/* Review Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold ">
                    {review.user.name || "Anonymous"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "text-yellow-400"
                              : "text-gray-600"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-neutral-content text-sm">
                    {formatDate(review.updatedAt)}
                  </span>
                </div>
                <p className="leading-relaxed mb-3">{review.review}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {reviews.length >= 10 && (
        <div className="text-center mt-8">
          <button className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-md font-semibold transition-colors">
            Load More Reviews
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieReviews;
