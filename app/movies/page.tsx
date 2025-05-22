import prisma from "@/prisma/client";
import NewMovieButton from "./NewMovieButton";

const MoviesPage = async () => {
  const movies = await prisma.movie.findMany();

  return (
    <div>
      <div className="mb-4">
        <NewMovieButton />
      </div>
      <div className="overflow-x-auto">
        <table className="table table-xs">
          {/* head */}
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Description</th>
              <th>Released Year</th>
              <th>Duration</th>
              <th>Director</th>
              <th>Poster URL</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, index) => {
              return (
                <tr key={movie.id}>
                  <th>{index}</th>
                  <td>{movie.title}</td>
                  <td>{movie.description}</td>
                  <td>{movie.releasedYear}</td>
                  <td>{movie.duration}</td>
                  <td>
                    {movie.directorFirstName} {movie.directorLastName}
                  </td>
                  <td className="truncate max-w-10">{movie.posterUrl}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoviesPage;
