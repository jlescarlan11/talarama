import { PrismaClient } from "@prisma/client";
import axios from "axios";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Your OMDb API Key
const OMDB_API_KEY = process.env.OMDB_API_KEY || "1301d52";
const OMDB_BASE_URL = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}`;

const movieTitles = [
  "Lilo & Stitch (2025)",
  "Mission: Impossible - The Final Reckoning",
  "Karate Kid: Legends",
  "Bring Her Back",
  "Fountain of Youth",
  "Mountainhead",
  "Sinners",
  "Final Destination Bloodlines",
  "Friendship",
  "Mickey 17",
  "The Phoenician Scheme",
  "Thunderbolts*",
  "Captain America: Brave New World",
  "Black Bag",
  "Mission: Impossible - Dead Reckoning Part One",
  "Pig",
  "Warfare",
  "Companion",
  "Fear Street: Prom Queen",
  "Nonnas",
  "Until Dawn",
  "A Minecraft Movie",
  "Hurry Up Tomorrow",
  "Disney's Snow White",
  "Ballerina",
  "The Last Rodeo",
  "Drop",
  "Havoc",
  "A Widow's Game",
  "Novocaine",
];

// Fetch movie data from OMDb
async function fetchMovie(title) {
  const { data } = await axios.get(OMDB_BASE_URL, {
    params: { t: title, plot: "full" },
  });
  return data.Response === "True" ? data : null;
}

async function upsertGenre(genreName) {
  const trimmedName = genreName.trim();
  let genre = await prisma.genre.findUnique({
    where: { genreName: trimmedName },
  });

  if (!genre) {
    genre = await prisma.genre.create({
      data: { genreName: trimmedName },
    });
  }

  return genre;
}

async function populateMovies() {
  console.log("Starting movie seeding...");

  for (const title of movieTitles) {
    console.log(`Processing: ${title}`);
    const omdb = await fetchMovie(title);
    if (!omdb) {
      console.warn(`No data found for ${title}`);
      continue;
    }

    const releasedYear = parseInt(omdb.Year, 10);
    const duration = parseInt(omdb.Runtime.replace(" min", ""), 10);
    const description = omdb.Plot;
    const posterUrl = omdb.Poster !== "N/A" ? omdb.Poster : null;

    // Parse director name (assuming single director)
    const directorFullName = omdb.Director.split(",")[0].trim();
    const [directorLastName, ...firstNameParts] = directorFullName
      .split(" ")
      .reverse();
    const directorFirstName = firstNameParts.reverse().join(" ");

    // Process genres
    const genres = omdb.Genre.split(",").map((g) => g.trim());
    const genreRecords = await Promise.all(genres.map(upsertGenre));

    try {
      // Create movie with genre relations
      const newMovie = await prisma.movie.create({
        data: {
          title: omdb.Title,
          description,
          releasedYear,
          duration,
          posterUrl,
          directorFirstName,
          directorLastName,
          genres: {
            create: genreRecords.map((genre) => ({
              genre: {
                connect: { id: genre.id },
              },
            })),
          },
        },
        include: {
          genres: {
            include: { genre: true },
          },
        },
      });

      console.log(`Created: ${newMovie.title} (${newMovie.releasedYear})`);
    } catch (error) {
      console.error(`Error creating movie ${title}:`, error.message);
    }
  }

  console.log("Movie seeding completed.");
}

// Run
populateMovies()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
