import MovieActions from "./MovieActions";
import { Skeleton } from "@/app/components";

const MoviesPage = async () => {
  const movies = [1, 2, 3, 4, 5];

  return (
    <div>
      <MovieActions />

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
            {movies.map((movie) => {
              return (
                <tr key={movie}>
                  <th>
                    <Skeleton />
                  </th>
                  <td>
                    <Skeleton />
                  </td>
                  <td>
                    <Skeleton />
                  </td>
                  <td>
                    <Skeleton />
                  </td>
                  <td>
                    <Skeleton />
                  </td>
                  <td>
                    <Skeleton />
                  </td>
                  <td className="truncate max-w-10">
                    <Skeleton />
                  </td>
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
