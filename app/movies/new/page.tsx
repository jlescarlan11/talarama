"use client";
import { MovieGenre } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

interface MovieForm {
  title: string;
  description: string;
  releasedYear: number;
  duration: number;
  posterUrl: string;
  directorFirstName: string;
  directorLastName: string;
  genres: MovieGenre;
}

const NewMoviePage = () => {
  const router = useRouter();

  const { register, handleSubmit } = useForm<MovieForm>();

  return (
    <form
      className="max-w-4xl mx-auto px-8 py-8"
      onSubmit={handleSubmit(async (data) => {
        await axios.post("/api/movies", data);
        router.push("/movies");
      })}
    >
      <div className="flex justify-center mb-4">
        <h1 className="text-2xl font-bold">Create New Movie</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Title</legend>
            <input
              type="text"
              {...register("title")}
              placeholder=""
              className="w-full input"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea
              className="textarea w-full h-24 sm:h-80 "
              {...register("description")}
            ></textarea>
          </fieldset>
        </div>
        <div>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Year Released</legend>
            <input
              type="number"
              {...register("releasedYear")}
              className="w-full input input-md "
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Duration</legend>
            <input
              type="number"
              {...register("duration")}
              className="w-full input input-md "
            />
            <p className="label">In minutes</p>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Poster Url</legend>
            <input
              type="url"
              {...register("posterUrl")}
              className="w-full input input-md "
            />
          </fieldset>

          <fieldset className="fieldset flex">
            <legend className="fieldset-legend">Director</legend>
            <div>
              <input
                type="text"
                {...register("directorFirstName")}
                className="w-full input input-md "
              />
              <p className="label">First Name</p>
            </div>
            <div>
              <input
                type="text"
                {...register("directorLastName")}
                className="w-full input input-md "
              />
              <p className="label">Last Name</p>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Genre/s</legend>
            <input
              type="text"
              {...register("genres")}
              className="w-full input"
            />
            <p className="label">Separated by a comma</p>
          </fieldset>
        </div>
      </div>

      <button className="btn btn-primary">Submit</button>
    </form>
  );
};

export default NewMoviePage;
