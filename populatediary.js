import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function populateDiary() {
  try {
    const user = await prisma.user.upsert({
      where: { id: "cmbkd9qze0000l404jl9wzzn4" },
      update: {},
      create: {
        id: "cmbkd9qze0000l404jl9wzzn4",
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
      },
    });

    const movies = [
      {
        title: "The Shawshank Redemption",
        releasedYear: 1994,
        duration: 142,
        description:
          "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        posterUrl: "https://example.com/shawshank.jpg",
        review:
          "An absolute masterpiece. The storytelling is perfect, and the ending gives me chills every time. Tim Robbins and Morgan Freeman deliver career-best performances.",
        rating: 5,
        watchedDate: "2024-05-15",
      },
      {
        title: "The Godfather",
        releasedYear: 1972,
        duration: 175,
        description:
          "The aging patriarch of an organized crime dynasty transfers control to his reluctant son.",
        posterUrl: "https://example.com/godfather.jpg",
        review:
          "Classic mafia drama with incredible performances by Brando and Pacino.",
        rating: 5,
        watchedDate: "2024-05-16",
      },
      {
        title: "The Dark Knight",
        releasedYear: 2008,
        duration: 152,
        description:
          "Batman faces the Joker in a gripping tale of chaos and morality.",
        posterUrl: "https://example.com/dark-knight.jpg",
        review:
          "Heath Ledger’s Joker is iconic. A dark, thrilling superhero film.",
        rating: 5,
        watchedDate: "2024-05-17",
      },
      {
        title: "Pulp Fiction",
        releasedYear: 1994,
        duration: 154,
        description:
          "Interwoven stories of crime in Los Angeles with Tarantino’s signature style.",
        posterUrl: "https://example.com/pulp-fiction.jpg",
        review: "Bold, stylish, and unforgettable. A cult classic.",
        rating: 4,
        watchedDate: "2024-05-18",
      },
      {
        title: "Forrest Gump",
        releasedYear: 1994,
        duration: 142,
        description:
          "The story of a slow-witted but kind-hearted man through decades of U.S. history.",
        posterUrl: "https://example.com/forrest-gump.jpg",
        review: "Heartwarming and inspiring. Tom Hanks is perfect.",
        rating: 5,
        watchedDate: "2024-05-19",
      },
      {
        title: "Inception",
        releasedYear: 2010,
        duration: 148,
        description:
          "A thief enters people’s dreams to steal secrets but is given a task of inception.",
        posterUrl: "https://example.com/inception.jpg",
        review: "Mind-bending visuals and brilliant storytelling.",
        rating: 5,
        watchedDate: "2024-05-20",
      },
      {
        title: "Fight Club",
        releasedYear: 1999,
        duration: 139,
        description:
          "An insomniac meets a mysterious man who introduces him to an underground fight club.",
        posterUrl: "https://example.com/fight-club.jpg",
        review: "Dark, edgy, and thought-provoking. A wild ride.",
        rating: 4,
        watchedDate: "2024-05-21",
      },
      {
        title: "The Matrix",
        releasedYear: 1999,
        duration: 136,
        description: "A hacker discovers the world is a simulated reality.",
        posterUrl: "https://example.com/matrix.jpg",
        review: "Revolutionary sci-fi with deep philosophical themes.",
        rating: 5,
        watchedDate: "2024-05-22",
      },
      {
        title: "The Lord of the Rings: The Fellowship of the Ring",
        releasedYear: 2001,
        duration: 178,
        description:
          "A hobbit and his companions set out to destroy a powerful ring.",
        posterUrl: "https://example.com/fellowship.jpg",
        review: "Epic and immersive fantasy storytelling.",
        rating: 5,
        watchedDate: "2024-05-23",
      },
      {
        title: "Gladiator",
        releasedYear: 2000,
        duration: 155,
        description: "A Roman general seeks revenge after being betrayed.",
        posterUrl: "https://example.com/gladiator.jpg",
        review: "Emotional and intense. Crowe delivers a powerful performance.",
        rating: 4,
        watchedDate: "2024-05-24",
      },
      {
        title: "Titanic",
        releasedYear: 1997,
        duration: 195,
        description: "A love story unfolds aboard the ill-fated RMS Titanic.",
        posterUrl: "https://example.com/titanic.jpg",
        review: "A tragic romance with stunning visuals and score.",
        rating: 4,
        watchedDate: "2024-05-25",
      },
      {
        title: "Interstellar",
        releasedYear: 2014,
        duration: 169,
        description:
          "A team of explorers travel through a wormhole in space to ensure humanity's survival.",
        posterUrl: "https://example.com/interstellar.jpg",
        review: "Beautiful, emotional, and mind-expanding.",
        rating: 5,
        watchedDate: "2024-05-26",
      },
      {
        title: "Whiplash",
        releasedYear: 2014,
        duration: 107,
        description:
          "A young drummer is pushed to the brink by a ruthless instructor.",
        posterUrl: "https://example.com/whiplash.jpg",
        review: "Intense and gripping. J.K. Simmons is phenomenal.",
        rating: 5,
        watchedDate: "2024-05-27",
      },
      {
        title: "The Social Network",
        releasedYear: 2010,
        duration: 120,
        description: "The rise of Facebook and the personal battles behind it.",
        posterUrl: "https://example.com/social-network.jpg",
        review: "Slick direction and sharp dialogue. A compelling drama.",
        rating: 4,
        watchedDate: "2024-05-28",
      },
      {
        title: "Parasite",
        releasedYear: 2019,
        duration: 132,
        description:
          "A poor family schemes to become employed by a wealthy household.",
        posterUrl: "https://example.com/parasite.jpg",
        review: "Brilliantly layered and socially incisive.",
        rating: 5,
        watchedDate: "2024-05-29",
      },
      {
        title: "Joker",
        releasedYear: 2019,
        duration: 122,
        description: "An origin story of the iconic villain set in Gotham.",
        posterUrl: "https://example.com/joker.jpg",
        review: "Disturbing yet mesmerizing. Phoenix is unforgettable.",
        rating: 4,
        watchedDate: "2024-05-30",
      },
      {
        title: "La La Land",
        releasedYear: 2016,
        duration: 128,
        description: "A jazz musician and aspiring actress fall in love in LA.",
        posterUrl: "https://example.com/lalaland.jpg",
        review: "Charming and melancholic. A love letter to dreamers.",
        rating: 4,
        watchedDate: "2024-06-01",
      },
      {
        title: "The Prestige",
        releasedYear: 2006,
        duration: 130,
        description:
          "Two rival magicians engage in a dangerous battle of one-upmanship.",
        posterUrl: "https://example.com/prestige.jpg",
        review: "Twisty and engrossing. Nolan at his best.",
        rating: 5,
        watchedDate: "2024-06-02",
      },
      {
        title: "Coco",
        releasedYear: 2017,
        duration: 105,
        description:
          "A young boy embarks on a journey in the Land of the Dead.",
        posterUrl: "https://example.com/coco.jpg",
        review: "Visually stunning and emotionally resonant.",
        rating: 5,
        watchedDate: "2024-06-03",
      },
      {
        title: "The Truman Show",
        releasedYear: 1998,
        duration: 103,
        description: "A man discovers his whole life is a reality TV show.",
        posterUrl: "https://example.com/truman.jpg",
        review: "Thought-provoking and moving. Carrey’s best.",
        rating: 5,
        watchedDate: "2024-06-04",
      },
    ];

    for (const movie of movies) {
      const dbMovie = await prisma.movie.upsert({
        where: {
          title_releasedYear: {
            title: movie.title,
            releasedYear: movie.releasedYear,
          },
        },
        update: {},
        create: {
          title: movie.title,
          description: movie.description,
          releasedYear: movie.releasedYear,
          duration: movie.duration,
          posterUrl: movie.posterUrl,
        },
      });

      const diaryEntry = await prisma.diaryEntry.create({
        data: {
          rating: movie.rating,
          review: movie.review,
          watchedDate: new Date(movie.watchedDate),
          userId: user.id,
          movieId: dbMovie.id,
        },
      });

      console.log(`Created diary entry for: ${movie.title}`, diaryEntry);
    }
  } catch (error) {
    console.error("Error populating diary entries:", error);
  } finally {
    await prisma.$disconnect();
  }
}

populateDiary();
