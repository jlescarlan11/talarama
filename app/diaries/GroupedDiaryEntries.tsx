// components/GroupedDiaryEntries.tsx (Server Component)
import React from "react";
import DiaryMonthGroup from "./DiaryMonthGroup";
import { DiaryEntryWithMovie } from "./types/diary";
import { PiCalendarBlank } from "react-icons/pi";

interface GroupedDiaryEntriesProps {
  entries: DiaryEntryWithMovie[];
}

interface GroupedEntries {
  [key: string]: DiaryEntryWithMovie[];
}

const GroupedDiaryEntries: React.FC<GroupedDiaryEntriesProps> = ({
  entries,
}) => {
  const groupEntriesByMonth = (
    entries: DiaryEntryWithMovie[]
  ): GroupedEntries => {
    return entries.reduce((groups: GroupedEntries, entry) => {
      const date = new Date(entry.watchedDate);
      const monthYear = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date);

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(entry);
      return groups;
    }, {});
  };

  const sortMonthKeys = (monthKeys: string[]): string[] => {
    return monthKeys.sort((a, b) => {
      const dateA = new Date(a + " 1");
      const dateB = new Date(b + " 1");
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-base-300 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-base-content/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-base-content">
            No diary entries yet
          </h3>
          <p className="text-base-content/70 mb-4">
            Start your movie journey by watching and rating your first film!
          </p>
          <button className="btn btn-primary">Add Your First Entry</button>
        </div>
      </div>
    );
  }

  const groupedEntries = groupEntriesByMonth(entries);
  const sortedMonthKeys = sortMonthKeys(Object.keys(groupedEntries));

  return (
    <div className="space-y-8">
      {/* Month Header */}
      {sortedMonthKeys.map((monthYear, index) => (
        <div key={monthYear} className=" rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-accent/20 rounded-full p-2">
              <PiCalendarBlank className="text-accent text-2xl" />
            </div>
            <h2 className="font-bold text-lg text-white">{monthYear}</h2>
          </div>
          <DiaryMonthGroup
            monthYear={monthYear}
            entries={groupedEntries[monthYear]}
            totalMovies={entries.length}
            isFirstGroup={index === 0}
          />
        </div>
      ))}
    </div>
  );
};

export default GroupedDiaryEntries;
