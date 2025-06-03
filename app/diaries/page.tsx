import { getServerSession } from "next-auth";
import Image from "next/image";
import { NextResponse } from "next/server";
import authOptions from "../auth/authOptions";
import NewDiaryEntryButton from "./NewDiaryEntryButton";
import TabsContainer from "./TabsContainer";

const DiaryPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({}, { status: 401 });

  return (
    <>
      <NewDiaryEntryButton />
      <div className="flex justify-between mb-4">
        <div className="flex gap-4 items-center">
          <Image
            src={session!.user.image!}
            width={100}
            height={100}
            alt="User profile"
            className="rounded-full m-0"
            quality={100}
            placeholder="empty" // Disables blur placeholder
            priority // Ensures immediate loading
          />
          <div>
            <p className="text-xl">{session!.user.username!}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex flex-col items-center px-4">
            <span>10</span>
            <span>films watched this year</span>
          </div>
          <div className="flex flex-col border-x-1 items-center px-4">
            <span>15</span>
            <span>diary entries</span>
          </div>
          <div className="flex flex-col items-center px-4">
            <span>romance</span>
            <span>top genre watched</span>
          </div>
        </div>
      </div>
      <div className="border-b"></div>
      <div>
        <TabsContainer />
      </div>
    </>
  );
};

export default DiaryPage;
