"use client";

import React, { useState } from "react";
import { Movie } from "@prisma/client";
import { FaStar } from "react-icons/fa";
import { FiCalendar, FiSave } from "react-icons/fi";
import Image from "next/image";

interface DiaryEntryFormProps {
  selectedMovie: Movie;
  onSuccess: () => void;
}

interface FormData {
  rating: number;
  review: string;
  watchedDate: string;
}

interface FormErrors {
  rating?: string;
  review?: string;
  watchedDate?: string;
  general?: string;
}

const DiaryEntryForm: React.FC<DiaryEntryFormProps> = ({
  selectedMovie,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    rating: 0,
    review: "",
    watchedDate: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    if (formData.review.trim().length < 10) {
      newErrors.review = "Review must be at least 10 characters long";
    }

    if (formData.review.trim().length > 2000) {
      newErrors.review = "Review cannot exceed 2000 characters";
    }

    if (!formData.watchedDate) {
      newErrors.watchedDate = "Please select when you watched this movie";
    } else {
      const watchedDate = new Date(formData.watchedDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (watchedDate > today) {
        newErrors.watchedDate = "Watched date cannot be in the future";
      }

      const minDate = new Date("1900-01-01");
      if (watchedDate < minDate) {
        newErrors.watchedDate = "Watched date cannot be before 1900";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors((prev) => ({ ...prev, rating: undefined }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        movieId: selectedMovie.id,
        rating: formData.rating,
        review: formData.review.trim(),
        watchedDate: formData.watchedDate,
      };

      const response = await fetch("/api/diary-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 400 && responseData.details) {
          // Handle Zod validation errors
          const zodErrors: FormErrors = {};

          if (responseData.details.rating?._errors) {
            zodErrors.rating = responseData.details.rating._errors[0];
          }
          if (responseData.details.review?._errors) {
            zodErrors.review = responseData.details.review._errors[0];
          }
          if (responseData.details.watchedDate?._errors) {
            zodErrors.watchedDate = responseData.details.watchedDate._errors[0];
          }
          if (responseData.details.movieId?._errors) {
            zodErrors.general = "Invalid movie selection";
          }

          setErrors(zodErrors);
          return;
        }

        throw new Error(responseData.error || "Failed to save diary entry");
      }

      // Reset form and call success callback
      setFormData({
        rating: 0,
        review: "",
        watchedDate: new Date().toISOString().split("T")[0],
      });
      setErrors({});
      onSuccess();

      // Create a temporary toast notification
      const toast = document.createElement("div");
      toast.className = "toast toast-top toast-center z-50";
      toast.innerHTML = `
        <div class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>${
            responseData.message || "Diary entry saved successfully!"
          }</span>
        </div>
      `;
      document.body.appendChild(toast);

      // Remove toast after 3 seconds
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    } catch (error) {
      console.error("Error saving diary entry:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Failed to save diary entry. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDirector = (
    firstName?: string | null,
    lastName?: string | null
  ) => {
    if (!firstName && !lastName) return "Unknown Director";
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error Alert */}
      {errors.general && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{errors.general}</span>
        </div>
      )}

      {/* Selected Movie Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Movie Summary */}
          <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg">
            <div className="w-20 h-30 bg-base-300 rounded flex-shrink-0 flex items-center justify-center">
              {selectedMovie.posterUrl ? (
                <Image
                  width={300}
                  height={450}
                  src={selectedMovie.posterUrl}
                  alt={selectedMovie.title}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <span className="text-xs text-base-content/50 text-center p-1">
                  No Poster
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-base-content">
                {selectedMovie.title}
              </h3>
              <p className="text-base-content/70 mt-1">
                Directed by{" "}
                {formatDirector(
                  selectedMovie.directorFirstName,
                  selectedMovie.directorLastName
                )}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-base-content/60">
                <span>{selectedMovie.releasedYear}</span>
                <span>{selectedMovie.duration} minutes</span>
              </div>
            </div>
          </div>

          {/* Watch Date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                When did you watch it?
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                className={`input input-bordered w-full ${
                  errors.watchedDate ? "input-error" : ""
                }`}
                value={formData.watchedDate}
                onChange={(e) =>
                  handleInputChange("watchedDate", e.target.value)
                }
                max={new Date().toISOString().split("T")[0]}
              />
              <FiCalendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-base-content/50 pointer-events-none" />
            </div>
            {errors.watchedDate && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.watchedDate}
                </span>
              </label>
            )}
          </div>

          {/* Rating */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Your Rating</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`text-2xl transition-colors duration-200 ${
                      star <= (hoveredRating || formData.rating)
                        ? "text-warning"
                        : "text-base-300"
                    } hover:text-warning`}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
              <span className="text-base-content/70 ml-2">
                {formData.rating > 0 ? `${formData.rating}/10` : "Not rated"}
              </span>
            </div>
            {errors.rating && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.rating}
                </span>
              </label>
            )}
          </div>

          {/* Review */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Your Review</span>
            </label>
            <textarea
              className={`textarea textarea-bordered h-40 resize-none ${
                errors.review ? "textarea-error" : ""
              }`}
              placeholder="What did you think about this movie? Share your thoughts, favorite scenes, or overall impression..."
              value={formData.review}
              onChange={(e) => handleInputChange("review", e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {formData.review.length}/2000 characters (minimum 10)
              </span>
              {errors.review && (
                <span className="label-text-alt text-error">
                  {errors.review}
                </span>
              )}
            </label>
          </div>
        </div>

        {/* Movie Poster Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <label className="label">
              <span className="label-text font-semibold">Movie Poster</span>
            </label>
            <div className="aspect-[2/3] bg-base-300 rounded-lg flex items-center justify-center border-2 border-dashed border-base-content/20">
              {selectedMovie.posterUrl ? (
                <Image
                  width={300}
                  height={450}
                  src={selectedMovie.posterUrl}
                  alt={selectedMovie.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center text-base-content/50 p-4">
                  <FaStar className="mx-auto text-4xl mb-2" />
                  <p className="text-sm">No poster available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-base-300">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
        >
          {!isSubmitting && <FiSave className="mr-2" />}
          {isSubmitting ? "Saving..." : "Save Diary Entry"}
        </button>
      </div>
    </form>
  );
};

export default DiaryEntryForm;
