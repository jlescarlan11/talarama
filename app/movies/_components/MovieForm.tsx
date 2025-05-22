"use client";
import ErrorMessage from "@/app/components/ErrorMessage";
import Spinner from "@/app/components/Spinner";
import { movieSchema } from "@/app/validationSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Genre, Movie, MovieGenre } from "@prisma/client";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiImage } from "react-icons/fi";
import { z } from "zod";

type MovieForm = z.infer<typeof movieSchema>;

type ExtendedMovie = Movie & {
  genres: (MovieGenre & {
    genre: Genre;
  })[];
};

const MovieForm = ({ movie }: { movie?: ExtendedMovie }) => {
  const router = useRouter();
  const [genreInput, setGenreInput] = useState(
    movie?.genres ? movie.genres.map((g) => g.genre.genreName).join(", ") : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPoster, setPreviewPoster] = useState<string>(
    movie?.posterUrl || ""
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    trigger,
  } = useForm<MovieForm>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: movie?.title || "",
      description: movie?.description || "",
      releasedYear: movie?.releasedYear || 0,
      duration: movie?.duration || 0,
      directorFirstName: movie?.directorFirstName || "",
      directorLastName: movie?.directorLastName || "",
      posterUrl: movie?.posterUrl || "",
      genres: movie?.genres ? movie.genres.map((g) => g.genre.genreName) : [],
    },
  });

  const onSubmit = async (data: MovieForm) => {
    const genreArray = genreInput
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g);

    if (genreArray.length === 0) {
      setError("genres", {
        type: "manual",
        message: "At least one genre is required",
      });
      return;
    }

    const updatedData: MovieForm = {
      ...data,
      genres: genreArray,
    };

    try {
      setIsSubmitting(true);
      if (movie) {
        await axios.patch("/api/movies/" + movie.id, updatedData);
      } else {
        await axios.post("/api/movies", updatedData);
      }
      router.push("/movies");
    } catch (error) {
      setIsSubmitting(false);
      console.error(error);
      setError("root", {
        type: "manual",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "releasedYear" | "duration"
  ) => {
    const value = e.target.value;
    const numValue = value === "" ? 0 : parseInt(value, 10);
    const finalValue = isNaN(numValue) ? 0 : numValue;
    setValue(fieldName, finalValue);
    trigger(fieldName);
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGenreInput(value);
    const genreArray = value
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g);
    setValue("genres", genreArray);
    trigger("genres");
  };

  const handlePosterUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    setPreviewPoster(url);
  };

  return (
    <div className="min-h-screen  py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* header */}
        <h1 className="text-3xl font-bold mb-4">Create a Movie</h1>

        {/* form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid  grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-8">
              <div className="card shadow-sm">
                <div className="card-body space-y-2">
                  <h2 className="card-title text-lg mb-4">Movie Details</h2>
                  {/* Title */}
                  <div className="form-control">
                    <label className="floating-label">
                      <span>Title</span>
                      <input
                        type="text"
                        placeholder="Enter movie title"
                        defaultValue={movie?.title || ""}
                        {...register("title")}
                        className={`input input-bordered w-full ${
                          errors.title ? "input-error" : ""
                        }`}
                      />
                    </label>
                    <ErrorMessage>{errors.title?.message}</ErrorMessage>
                  </div>
                  {/* Description */}
                  <div className="form-control">
                    <label className="floating-label">
                      <span>Description</span>
                      <textarea
                        placeholder="Enter movie description..."
                        {...register("description")}
                        defaultValue={movie?.description || ""}
                        className={`textarea textarea-bordered h-32 resize-none w-full ${
                          errors.description ? "textarea-error" : ""
                        }`}
                      />
                    </label>
                    <ErrorMessage>{errors.description?.message}</ErrorMessage>
                  </div>

                  {/* Year and duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="floating-label">
                        <span>Year Released</span>
                        <input
                          type="number"
                          defaultValue={movie?.releasedYear || 0}
                          placeholder="Enter movie release year"
                          min="1900"
                          max="2030"
                          onChange={(e) => handleNumberInput(e, "releasedYear")}
                          className={`input input-bordered ${
                            errors.releasedYear ? "input-error" : ""
                          }`}
                        />
                      </label>
                      <ErrorMessage>
                        {errors.releasedYear?.message}
                      </ErrorMessage>
                    </div>
                    <div className="form-control">
                      <label className="floating-label">
                        <span>Duration (minutes)</span>
                        <input
                          type="number"
                          defaultValue={movie?.duration || 0}
                          placeholder="Enter movie duration in minutes"
                          min="1"
                          onChange={(e) => handleNumberInput(e, "duration")}
                          className={`input input-bordered ${
                            errors.duration ? "input-error" : ""
                          }`}
                        />
                      </label>
                      <ErrorMessage>{errors.duration?.message}</ErrorMessage>
                    </div>
                  </div>

                  {/* Director */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="floating-label">
                        <span>Director&apos;s First Name</span>
                        <input
                          type="text"
                          defaultValue={movie?.directorFirstName || 0}
                          placeholder="Enter Director's First name"
                          {...register("directorFirstName")}
                          className={`input input-bordered w-full ${
                            errors.directorFirstName ? "input-error" : ""
                          }`}
                        />
                      </label>
                      <ErrorMessage>
                        {errors.directorFirstName?.message}
                      </ErrorMessage>
                    </div>
                    <div className="form-control">
                      <label className="floating-label">
                        <span>Director&apos;s Last Name</span>
                        <input
                          type="text"
                          defaultValue={movie?.directorLastName || ""}
                          placeholder="Enter Director's Last name"
                          {...register("directorLastName")}
                          className={`input input-bordered w-full ${
                            errors.directorLastName ? "input-error" : ""
                          }`}
                        />
                      </label>
                      <ErrorMessage>
                        {errors.directorLastName?.message}
                      </ErrorMessage>
                    </div>
                  </div>

                  {/* Genres */}
                  {/* Title */}
                  <div className="form-control">
                    <label className="floating-label">
                      <span>Genres</span>
                      <input
                        type="text"
                        placeholder="Enter Movie Genres separated by commas"
                        defaultValue={
                          movie?.genres
                            ? movie.genres.map((g) => g.genre.genreName)
                            : []
                        }
                        onChange={handleGenreChange}
                        className={`input input-bordered w-full ${
                          errors.genres ? "input-error" : ""
                        }`}
                      />
                    </label>
                    <ErrorMessage>{errors.genres?.message}</ErrorMessage>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="space-y-8">
              <div className="card shadow-sm">
                <div className="card-body space-y-2">
                  <h2 className="card-title text-lg mb-4">Movie Poster</h2>
                  {/* Poster URL */}
                  <div className="form-control">
                    <label className="floating-label">
                      <span>Poster URL</span>
                      <input
                        type="url"
                        defaultValue={movie?.posterUrl || ""} // Changed from value to defaultValue
                        placeholder="Enter Poster URL"
                        {...register("posterUrl")}
                        onBlur={handlePosterUrlBlur}
                        className={`input input-bordered ${
                          errors.posterUrl ? "input-error" : ""
                        }`}
                      />
                    </label>
                    <ErrorMessage>{errors.posterUrl?.message}</ErrorMessage>
                  </div>

                  {/* Poster Preview */}
                  <div className="mt-4">
                    <label className="label">
                      <span className="label-text font-semibold">Preview</span>
                    </label>
                    <div className="aspect-[2/3] bg-base-300 rounded-lg overflow-hidden border-2 border-dashed border-base-content/20">
                      {previewPoster ? (
                        <Image
                          src={previewPoster}
                          alt="Poster preview"
                          width={300}
                          height={450}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-base-content/40">
                          <div className="text-center">
                            <FiImage className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">Poster preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Submit Button */}
          <div className="flex justify-start pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-md"
            >
              {movie ? "Update Movie" : "Submit Move"}
              {isSubmitting && <Spinner />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovieForm;
