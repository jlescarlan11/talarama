import Link from "next/link";

const NewMovieButton = () => {
  return (
    <div>
      <button>
        <Link href="movies/new"> New Movie</Link>
      </button>
    </div>
  );
};

export default NewMovieButton;
