import { diaryEntrySchema } from "@/app/validationSchemas";
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";

// Add caching headers
const CACHE_CONTROL = {
  GET: "private, s-maxage=30, stale-while-revalidate=60", // Cache for 30 seconds, stale for 1 minute
  POST: "no-store", // Don't cache POST requests
};

export async function POST(request: NextRequest) {
  console.log("=== DIARY ENTRY POST REQUEST START ===");

  const session = await getServerSession(authOptions);
  console.log(
    "Session:",
    session
      ? { userId: session.user.id, userEmail: session.user.email }
      : "No session"
  );

  if (!session) {
    console.log("❌ No session found - returning 401");
    return NextResponse.json({ error: "Unauthorized" }, { 
      status: 401,
      headers: {
        "Cache-Control": CACHE_CONTROL.POST,
      },
    });
  }

  try {
    const body = await request.json();
    console.log("📥 Request body:", JSON.stringify(body, null, 2));

    const validation = diaryEntrySchema.safeParse(body);

    if (!validation.success) {
      console.log(
        "❌ Validation errors:",
        JSON.stringify(validation.error.format(), null, 2)
      );
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const data = validation.data;
    console.log("✅ Validated data:", JSON.stringify(data, null, 2));

    // Check if movie exists
    const movieExists = await prisma.movie.findUnique({
      where: { id: data.movieId },
    });
    console.log(
      "🎬 Movie exists:",
      movieExists ? `Yes - ${movieExists.title}` : "No"
    );

    if (!movieExists) {
      console.log("❌ Movie not found");
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    console.log(
      "👤 User exists:",
      userExists ? `Yes - ${userExists.email}` : "No"
    );

    if (!userExists) {
      console.log("❌ User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate date
    const watchedDate = new Date(data.watchedDate);
    console.log(
      "📅 Parsed watchedDate:",
      watchedDate,
      "isValid:",
      !isNaN(watchedDate.getTime())
    );

    if (isNaN(watchedDate.getTime())) {
      console.log("❌ Invalid date format");
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    console.log("💾 Creating diary entry with data:", {
      review: data.review,
      rating: data.rating,
      movieId: data.movieId,
      userId: session.user.id,
      watchedDate: watchedDate,
    });

    const newDiaryEntry = await prisma.diaryEntry.create({
      data: {
        review: data.review,
        rating: data.rating,
        movieId: data.movieId,
        userId: session.user.id,
        watchedDate: watchedDate,
      },
    });

    console.log(
      "✅ Diary entry created successfully:",
      JSON.stringify(newDiaryEntry, null, 2)
    );
    console.log("=== DIARY ENTRY POST REQUEST END ===");

    return NextResponse.json(newDiaryEntry, { 
      status: 201,
      headers: {
        "Cache-Control": CACHE_CONTROL.POST,
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      console.error("Database error code:", error.code);
    }

    console.log("=== DIARY ENTRY POST REQUEST END (WITH ERROR) ===");

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { 
        status: 500,
        headers: {
          "Cache-Control": CACHE_CONTROL.POST,
        },
      }
    );
  }
}
