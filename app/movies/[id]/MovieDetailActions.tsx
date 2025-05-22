import { Link } from "@/app/components";
import { Movie } from "@prisma/client";
import React from "react";

interface Props {
  movie: Movie;
}

const MovieDetailActions = ({ movie }: Props) => {
  return (
    <div>
      <button className="btn btn-primary">
        <Link href={`/movies/${movie.id}/edit`}>Edit Movie</Link>
      </button>
    </div>
  );
};

export default MovieDetailActions;
