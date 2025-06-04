"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import MovieSearch from "./MovieSearch";
import StarRating from "../new/StarRating";
import { Movie, DiaryFormData, FormErrors } from "../types/diary";
import Image from "next/image";

interface DiaryFormProps {
  movies: Movie[];
  diary?: DiaryEntryWithMovie;
}

const DiaryForm: React.FC<DiaryFormProps> = ({ movies, diary }) => {
  const router = useRouter();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<DiaryFormData>({
    movieId: "",
    rating: 0,
    review: "",
    watchedDate: new Date().toISOString().split("T")[0], // Default to today
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setValue("movieId", movie.id);
    trigger("movieId");
  };

  const handleRatingChange = (rating: number) => {
    setValue("rating", rating);
    trigger("rating");
  };

  const validateWatchedDate = (dateString: string): boolean => {
    if (!dateString) return false;

    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return selectedDate <= today;
  };

  const onSubmit = async (data: DiaryFormData) => {
    // Additional date validation
    if (!validateWatchedDate(data.watchedDate)) {
      setError("watchedDate", {
        type: "manual",
        message: "Watched date cannot be in the future",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (diary) {
        await axios.patch(`/api/diaries/${diary.id}`, data);
      } else {
        await axios.post("/api/diaries", data);
      }

      router.push("/diaries");
      router.refresh();
    } catch (error) {
      setIsSubmitting(false);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error;

        switch (status) {
          case 400:
            setError("root", {
              type: "manual",
              message: "Validation failed. Please check your input.",
            });
            break;
          case 401:
            setError("root", {
              type: "manual",
              message: "You must be logged in to create diary entries.",
            });
            break;
          case 404:
            setError("root", {
              type: "manual",
              message: "Movie or user not found.",
            });
            break;
          default:
            setError("root", {
              type: "manual",
              message: errorMessage || "An unexpected error occurred",
            });
        }
      } else {
        setError("root", {
          type: "manual",
          message: "Network error - please check your connection",
        });
      }
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">
          {diary ? "Edit your film diary..." : "Add to your films..."}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side - Form inputs */}
            <div className="lg:col-span-2">
              <div className="card shadow-sm">
                <div className="card-body space-y-6">
                  <h2 className="card-title text-lg">Diary Details</h2>

                  <DiaryFormFields
                    movies={movies}
                    selectedMovie={selectedMovie}
                    onMovieSelect={handleMovieSelect}
                    register={register}
                    errors={errors}
                    watchedFields={watchedFields}
                    onRatingChange={handleRatingChange}
                    isEditMode={!!diary}
                  />
                </div>
              </div>
            </div>

            {/* Right side - Movie poster preview */}
            <div className="lg:col-span-1">
              <div className="card shadow-sm sticky top-6">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">Movie Preview</h2>
                  <MoviePreview selectedMovie={selectedMovie} />
                </div>
              </div>
            </div>
          </div>

          {/* General error message */}
          {errors.root && (
            <div className="alert alert-error">
              <span>{errors.root.message}</span>
            </div>
          )}

          {/* Submit button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary px-8"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {diary ? "Updating..." : "Saving..."}
                </>
              ) : diary ? (
                "Update Entry"
              ) : (
                "Save Entry"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiaryForm;
