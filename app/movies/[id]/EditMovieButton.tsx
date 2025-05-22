import { Link } from "@/app/components";
import React from "react";

const EditMovieButton = ({ movieId }: { movieId: string }) => {
  return (
    <div>
      <button className="btn btn-primary">
        <Link href={`/movies/${movieId}/edit`}>Edit Movie</Link>
      </button>
    </div>
  );
};

export default EditMovieButton;
