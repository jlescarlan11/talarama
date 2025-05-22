import { Link } from "@/app/components";

const MovieActions = () => {
  return (
    <div className="mb-4">
      <button className="btn btn-primary">
        <Link href="movies/new"> New Movie</Link>
      </button>
    </div>
  );
};

export default MovieActions;
