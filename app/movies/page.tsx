"use client";

import NewMovieModal from "./NewMovieModal";

const MoviesPage = () => {
  return (
    <div>
      <label htmlFor="new-movie-modal" className="btn btn-primary">
        New Movie
      </label>

      <NewMovieModal />
    </div>
  );
};

export default MoviesPage;
