"use client";

import { useSession } from "next-auth/react";
import { PiFilmSlate, PiHeartFill } from "react-icons/pi";
import { useEffect, useState } from "react";

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
}

interface Stats {
  totalMovies: number;
  averageRating: number;
  favoriteGenre: string;
  watchTime: string;
}

const ProfilePage = () => {
  const { data: session } = useSession();
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMovies: 0,
    averageRating: 0,
    favoriteGenre: "None",
    watchTime: "0 hours",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) throw new Error("Failed to fetch profile data");
        const data = await response.json();
        setLikedMovies(data.likedMovies);
        setStats(data.stats);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfileData();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="bg-[#22124a] rounded-lg p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full bg-[#2a1657]" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-[#2a1657] rounded" />
                <div className="h-4 w-48 bg-[#2a1657] rounded" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#2a1657] p-4 rounded-lg h-20" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 w-32 bg-[#2a1657] rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#2a1657] rounded-lg p-4 h-24" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <div className="bg-[#22124a] rounded-lg p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center">
            <span className="text-3xl text-white">
              {session?.user?.name?.[0] || "U"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{session?.user?.name || "User"}</h1>
            <p className="text-white/60">{session?.user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2a1657] p-4 rounded-lg">
            <h3 className="text-white/60 text-sm">Total Movies</h3>
            <p className="text-2xl font-bold text-white">{stats.totalMovies}</p>
          </div>
          <div className="bg-[#2a1657] p-4 rounded-lg">
            <h3 className="text-white/60 text-sm">Average Rating</h3>
            <p className="text-2xl font-bold text-white">{stats.averageRating}</p>
          </div>
          <div className="bg-[#2a1657] p-4 rounded-lg">
            <h3 className="text-white/60 text-sm">Favorite Genre</h3>
            <p className="text-2xl font-bold text-white">{stats.favoriteGenre}</p>
          </div>
          <div className="bg-[#2a1657] p-4 rounded-lg">
            <h3 className="text-white/60 text-sm">Watch Time</h3>
            <p className="text-2xl font-bold text-white">{stats.watchTime}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Liked Movies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {likedMovies.map((movie) => (
            <div key={movie.id} className="bg-[#22124a] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{movie.title}</h3>
                <PiHeartFill className="text-accent text-xl" />
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <PiFilmSlate />
                <span>{movie.year}</span>
                <span>•</span>
                <span>Rating: {movie.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 