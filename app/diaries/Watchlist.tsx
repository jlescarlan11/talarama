import { useState } from 'react';

type Movie = {
  id: number;
  title: string;
  poster: string;
  year: number;
  genre: string[];
};

const Watchlist = () => {
  // Sample movie data - replace with your actual data source
  const [movies, setMovies] = useState<Movie[]>([
    {
      id: 1,
      title: 'Inception',
      poster: 'https://via.placeholder.com/150x225?text=Inception',
      year: 2010,
      genre: ['Action', 'Sci-Fi'],
    },
    {
      id: 2,
      title: 'The Shawshank Redemption',
      poster: 'https://via.placeholder.com/150x225?text=Shawshank',
      year: 1994,
      genre: ['Drama'],
    },
    {
      id: 3,
      title: 'Pulp Fiction',
      poster: 'https://via.placeholder.com/150x225?text=Pulp+Fiction',
      year: 1994,
      genre: ['Crime', 'Drama'],
    },
    {
      id: 4,
      title: 'The Dark Knight',
      poster: 'https://via.placeholder.com/150x225?text=Dark+Knight',
      year: 2008,
      genre: ['Action', 'Crime', 'Drama'],
    },
    {
      id: 5,
      title: 'Forrest Gump',
      poster: 'https://via.placeholder.com/150x225?text=Forrest+Gump',
      year: 1994,
      genre: ['Drama', 'Romance'],
    },
    {
      id: 6,
      title: 'The Matrix',
      poster: 'https://via.placeholder.com/150x225?text=Matrix',
      year: 1999,
      genre: ['Action', 'Sci-Fi'],
    },
  ]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Movies to watch soon...</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <div key={movie.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <figure>
              <img 
                src={movie.poster} 
                alt={movie.title} 
                className="w-full h-64 object-cover"
              />
            </figure>
            <div className="card-body p-4">
              <h3 className="card-title text-sm line-clamp-2">{movie.title}</h3>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{movie.year}</span>
                <span className="badge badge-sm badge-outline">
                  {movie.genre[0]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;s