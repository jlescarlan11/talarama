import { getServerSession } from "next-auth";
import Image from "next/image";
import { NextResponse } from "next/server";
import authOptions from "../auth/authOptions";
import TabsContainer from "./TabsContainer";
import { PiHeartFill, PiBookOpenText } from "react-icons/pi";
import React from "react";
import prisma from "@/prisma/client";

const DiaryPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({}, { status: 401 });

  const diaryEntries = await prisma.diaryEntry.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      movie: {
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
        },
      },
    },
  });

  const totalMovies = diaryEntries.length;

  const genreCounts = diaryEntries.reduce((acc, entry) => {
    entry.movie.genres.forEach(({ genre }) => {
      acc[genre.genreName] = (acc[genre.genreName] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const favoriteGenre =
    Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "None";

  const stats = [
    {
      label: "diary entries",
      value: totalMovies,
      icon: <PiBookOpenText className="text-2xl text-accent" />,
    },
    {
      label: "top genre",
      value: favoriteGenre.toLowerCase(),
      icon: <PiHeartFill className="text-sm text-accent" />,
    },
  ];

  return (
    <div className="bg-base-100 text-base-content">
      <div className="rounded-2xl shadow-lg p-8 mb-8 bg-base-200 flex flex-col md:flex-row items-center gap-8">
        <div className="flex flex-col items-center  gap-4 md:flex-row md:gap-8 w-full">
          <Image
            src={session.user.image!}
            width={100}
            height={100}
            alt="User profile"
            className="rounded-full border-3 border-primary shadow-lg"
            quality={100}
            placeholder="empty"
            priority
          />
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-2xl font-bold text-primary">
              {session.user.username!}
            </p>
          </div>
        </div>
        <div className="flex flex-row sm:gap-12 w-full justify-center items-center">
          {stats.map((stat, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <div className="h-10 w-px bg-base-content/30 mx-6" />}
              <div className="flex flex-col items-center sm:min-w-[120px]">
                <div className="flex items-center gap-3 mb-1">
                  {React.cloneElement(stat.icon, {
                    className: "text-lg sm:text-4xl text-accent",
                  })}
                  <span className="text-lg sm:text-4xl font-extrabold text-primary">
                    {stat.value}
                  </span>
                </div>
                <span className="text-lg text-base-content/70 font-medium text-center">
                  {stat.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="border-b border-base-content/10 mb-4"></div>
      <div>
        <TabsContainer />
      </div>
    </div>
  );
};

export default DiaryPage;
