// components/MyDiaries.tsx
import prisma from "@/prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "../auth/authOptions";
import GroupedDiaryEntriesWrapper from "./GroupedDiaryEntriesWrapper";

const MyDiaries = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-8 bg-base-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-base-content">
            Please sign in to view your diary
          </h2>
        </div>
      </div>
    );
  }

  const diaryEntries = await prisma.diaryEntry.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          description: true,
          releasedYear: true,
          duration: true,
          posterUrl: true,
          directorFirstName: true,
          directorLastName: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      watchedDate: "desc",
    },
  });

  return (
    <div className="bg-base-100 text-base-content">
      <GroupedDiaryEntriesWrapper entries={diaryEntries} />
    </div>
  );
};

export default MyDiaries;
