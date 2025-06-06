import { PrismaClient } from "@prisma/client";
import axios from "axios";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Your OMDb API Key
const OMDB_API_KEY = process.env.OMDB_API_KEY || "1301d52";
const OMDB_BASE_URL = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}`;

const movieTitles = [
  "The Shawshank Redemption",
  "The Godfather",
  "The Dark Knight",
  "The Godfather Part II",
  "12 Angry Men",
  "The Lord of the Rings: The Return of the King",
  "Schindler's List",
  "Pulp Fiction",
  "The Lord of the Rings: The Fellowship of the Ring",
  "The Good, the Bad and the Ugly",
  "Forrest Gump",
  "The Lord of the Rings: The Two Towers",
  "Fight Club",
  "Inception",
  "Star Wars: Episode V - The Empire Strikes Back",
  "The Matrix",
  "Goodfellas",
  "Interstellar",
  "One Flew Over the Cuckoo's Nest",
  "Se7en",
  "It's a Wonderful Life",
  "The Silence of the Lambs",
  "Seven Samurai",
  "Saving Private Ryan",
  "City of God",
  "The Green Mile",
  "Life Is Beautiful",
  "Terminator 2: Judgment Day",
  "Star Wars: Episode IV - A New Hope",
  "Back to the Future",
  "Spirited Away",
  "The Pianist",
  "Gladiator",
  "Parasite",
  "Psycho",
  "The Lion King",
  "Grave of the Fireflies",
  "The Departed",
  "Whiplash",
  "Harakiri",
  "The Prestige",
  "American History X",
  "Léon: The Professional",
  "Spider-Man: Across the Spider-Verse",
  "Casablanca",
  "The Usual Suspects",
  "The Intouchables",
  "Cinema Paradiso",
  "Alien",
  "Modern Times",
  "Rear Window",
  "Once Upon a Time in the West",
  "Django Unchained",
  "City Lights",
  "Apocalypse Now",
  "Dune: Part Two",
  "WALL·E",
  "Memento",
  "Raiders of the Lost Ark",
  "The Lives of Others",
  "Avengers: Infinity War",
  "Sunset Boulevard",
  "Spider-Man: Into the Spider-Verse",
  "Witness for the Prosecution",
  "Paths of Glory",
  "The Shining",
  "The Great Dictator",
  "12th Fail",
  "Inglourious Basterds",
  "Aliens",
  "The Dark Knight Rises",
  "Coco",
  "Amadeus",
  "Toy Story",
  "Toy Story 3",
  "The Hunt",
  "Ikiru",
  "Eternal Sunshine of the Spotless Mind",
  "2001: A Space Odyssey",
  "Incendies",
  "The Chaos Class Failed the Class",
  "Reservoir Dogs",
  "The Apartment",
  "Lawrence of Arabia",
  "Scarface",
  "Double Indemnity",
  "Heat",
  "North by Northwest",
  "Up",
  "Citizen Kane",
  "M",
  "Full Metal Jacket",
  "Vertigo",
  "Amélie",
  "A Separation",
  "Like Stars on Earth",
  "To Kill a Mockingbird",
  "Die Hard",
  "A Clockwork Orange",
  "The Sting",
  "Indiana Jones and the Last Crusade",
  "Oppenheimer",
  "Metropolis",
  "Snatch",
  "1917",
  "L.A. Confidential",
  "Bicycle Thieves",
  "Downfall",
  "Dangal",
  "The Wolf of Wall Street",
  "Hamilton",
  "Taxi Driver",
  "Green Book",
  "Batman Begins",
  "The Truman Show",
  "For a Few Dollars More",
  "Judgment at Nuremberg",
  "Some Like It Hot",
  "Shutter Island",
  "The Kid",
  "The Father",
  "All About Eve",
  "Jurassic Park",
  "There Will Be Blood",
  "The Sixth Sense",
  "Casino",
  "Ran",
  "Top Gun: Maverick",
  "No Country for Old Men",
  "The Thing",
  "Pan's Labyrinth",
  "Unforgiven",
  "Kill Bill: Vol. 1",
  "A Beautiful Mind",
  "The Treasure of the Sierra Madre",
  "Prisoners",
  "Yojimbo",
  "Finding Nemo",
  "Howl's Moving Castle",
  "The Great Escape",
  "Monty Python and the Holy Grail",
  "The Elephant Man",
  "Dial M for Murder",
  "Klaus",
  "Gone with the Wind",
  "Chinatown",
  "Rashomon",
  "The Secret in Their Eyes",
  "Lock, Stock and Two Smoking Barrels",
  "V for Vendetta",
  "Inside Out",
  "Three Billboards Outside Ebbing, Missouri",
  "The Bridge on the River Kwai",
  "Catch Me If You Can",
  "Trainspotting",
  "Raging Bull",
  "The Wild Robot",
  "Fargo",
  "Warrior",
  "Harry Potter and the Deathly Hallows: Part 2",
  "Gran Torino",
  "Million Dollar Baby",
  "Ben-Hur",
  "Mad Max: Fury Road",
  "My Neighbor Totoro",
  "Barry Lyndon",
  "Dead Poets Society",
  "Spider-Man: No Way Home",
  "Children of Heaven",
  "12 Years a Slave",
  "Hacksaw Ridge",
  "Before Sunrise",
  "The Grand Budapest Hotel",
  "Blade Runner",
  "Gone Girl",
  "Memories of Murder",
  "Ratatouille",
  "Monsters, Inc.",
  "In the Name of the Father",
  "How to Train Your Dragon",
  "Wild Tales",
  "The Gold Rush",
  "Sherlock Jr.",
  "Jaws",
  "Mary and Max",
  "Ford v Ferrari",
  "The Deer Hunter",
  "The General",
  "The Wages of Fear",
  "Mr. Smith Goes to Washington",
  "On the Waterfront",
  "Wild Strawberries",
  "Logan",
  "Rocky",
  "The Third Man",
  "Tokyo Story",
  "Spotlight",
  "The Big Lebowski",
  "The Terminator",
  "Maharaja",
  "Pirates of the Caribbean: The Curse of the Black Pearl",
  "The Seventh Seal",
  "Room",
  "La haine",
  "Jai Bhim",
  "Hotel Rwanda",
  "Platoon",
  "The Best Years of Our Lives",
  "Before Sunset",
  "The Exorcist",
  "The Sound of Music",
  "The Passion of Joan of Arc",
  "The Incredibles",
  "The Wizard of Oz",
  "Hachi: A Dog's Tale",
  "I'm Still Here",
  "Rush",
  "Stand by Me",
  "My Father and My Son",
  "Network",
  "The Iron Giant",
  "The Handmaiden",
  "A Silent Voice: The Movie",
  "The Battle of Algiers",
  "To Be or Not to Be",
  "The Grapes of Wrath",
  "Into the Wild",
  "Groundhog Day",
  "The Help",
  "Gangs of Wasseypur",
  "Amores Perros",
  "Drishyam",
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
