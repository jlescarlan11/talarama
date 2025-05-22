"use client";

import Link from "next/link";

const MoviesPage = () => {
  return (
    <div>
      <button>
        <Link href="movies/new"> New Movie</Link>
      </button>
    </div>
  );
};

export default MoviesPage;
