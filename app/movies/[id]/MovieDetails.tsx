import { Genre, Movie, MovieCategorizesAs } from "@prisma/client";
import Image from "next/image";
import React from "react";

type ExtendedMovie = Movie & {
  genres: (MovieCategorizesAs & {
    genre: Genre;
  })[];
};

const MovieDetails = ({ movie }: { movie: ExtendedMovie }) => {
  return (
    <div>
      <p>{movie.title}</p>
      <p>{movie.description}</p>
      <p>{movie.releasedYear}</p>
      <p>{movie.duration}</p>
      <Image
        src={movie.posterUrl ?? "/placeholder.png"}
        height={200}
        width={200}
        alt="image"
      />
      <p>
        {movie.directorFirstName} {movie.directorLastName}
      </p>
      <p>{movie.genres.map((mg) => mg.genre.genreName).join(", ")}</p>
    </div>
  );
};

export default MovieDetails;
