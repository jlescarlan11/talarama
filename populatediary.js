import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function populateDiary() {
  try {
    const userId = "cmbkeiv9w0000lf0a36o63jdz";

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "Diary User",
        email: "diaryuser@example.com",
        username: "diaryuser",
      },
    });

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
    ];

    for (let i = 0; i < movieTitles.length; i++) {
      const title = movieTitles[i];
      const releasedYear = 2025; // Default for upcoming/future films
      const duration = 100 + i; // Arbitrary variation
      const posterUrl = `https://example.com/poster-${i + 1}.jpg`;
      const description = `A description for the movie "${title}".`;

      const dbMovie = await prisma.movie.upsert({
        where: {
          title_releasedYear: {
            title,
            releasedYear,
          },
        },
        update: {},
        create: {
          title,
          description,
          releasedYear,
          duration,
          posterUrl,
        },
      });

      const diaryEntry = await prisma.diaryEntry.create({
        data: {
          rating: Math.floor(Math.random() * 3) + 3, // 3 to 5
          review: `Watched "${title}" recently. Surprisingly good for a ${duration}-minute film.`,
          watchedDate: new Date(2024, 4, 10 + i), // Spread over May 2024
          userId: user.id,
          movieId: dbMovie.id,
        },
      });

      console.log(`Created diary entry for: ${title}`, diaryEntry);
    }
  } catch (error) {
    console.error("Error populating diary entries:", error);
  } finally {
    await prisma.$disconnect();
  }
}

populateDiary();
