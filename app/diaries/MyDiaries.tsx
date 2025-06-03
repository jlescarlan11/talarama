// components/MyDiaries.tsx
import prisma from "@/prisma/client";
import { getServerSession } from "next-auth";
import React from "react";
import authOptions from "../auth/authOptions";
import GroupedDiaryEntries from "./GroupedDiaryEntries";
import { DiaryEntryWithMovie } from "./types/diary";

const MyDiaries = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Please sign in to view your diary
          </h2>
        </div>
      </div>
    );
  }

  const diaryEntries: DiaryEntryWithMovie[] = await prisma.diaryEntry.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          posterUrl: true,
          releasedYear: true,
        },
      },
    },
    orderBy: {
      watchedDate: "desc",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Grouped Diary Entries */}
      <GroupedDiaryEntries entries={diaryEntries} />

      {/* Load More Section - Future Enhancement */}
      {diaryEntries.length > 20 && (
        <div className="text-center mt-12 pt-8 border-t border-base-300">
          <button className="btn btn-outline btn-wide">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            Load Earlier Entries
          </button>
        </div>
      )}
    </div>
  );
};

export default MyDiaries;
