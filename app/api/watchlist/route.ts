import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";
import prisma from "@/prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  try {
    const watchlist = await prisma.watchedList.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        movie: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to only include movie information
    const movies = watchlist.map((item) => item.movie);

    return NextResponse.json(movies);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 