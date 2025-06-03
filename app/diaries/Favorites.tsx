import React from "react";

const favoriteFilms = [
  { title: "Little Women", image: "/films/little-women.jpg" },
  { title: "The Boy and the Heron", image: "/films/boy-and-heron.jpg" },
  { title: "Decision to Leave", image: "/films/decision-to-leave.jpg" },
  { title: "Flow", image: "/films/flow.jpg" },
  { title: "Your Name", image: "/films/your-name.jpg" },
];

export default function FavoritesGrid() {
  return (
    <div className="p-6 bg-gray-100 dark:bg-zinc-800 rounded-xl transition-colors duration-300">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {favoriteFilms.map((film) => (
          <div
            key={film.title}
            className="rounded-xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-200"
          >
            <img
              src={film.image}
              alt={film.title}
              className="w-full h-auto object-cover rounded-xl"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
