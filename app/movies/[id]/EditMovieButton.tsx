import { Link } from "@/app/components";
import React from "react";

const EditMovieButton = ({ movieId }: { movieId: string }) => {
  return (
    <button className="btn btn-primary">
      <Link href={`/movies/edit/${movieId}`}>Edit Movie</Link>
    </button>
  );
};

export default EditMovieButton;
