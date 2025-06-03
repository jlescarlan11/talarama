// components/DiaryMonthGroup.tsx (Server Component)
import React from "react";
import { DiaryEntryWithMovie } from "./types/diary";
import DiaryEntryCard from "./DiaryEntryCard";

interface DiaryMonthGroupProps {
  monthYear: string;
  entries: DiaryEntryWithMovie[];
  totalMovies: number;
}

const DiaryMonthGroup: React.FC<DiaryMonthGroupProps> = ({
  monthYear,
  entries,
  totalMovies,
}) => {
  return (
    <div className="border-b pb-4">
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={entry.id} className="grid grid-cols-12 gap-4">
            {/* Month column - shows only for first entry */}
            <div className="col-span-2">
              {index === 0 && (
                <>
                  <h2 className="font-bold text-base-content text-lg">
                    {monthYear}
                  </h2>
                </>
              )}
            </div>

            {/* Entry content spans remaining 3 columns */}
            <div className="col-span-10">
              <DiaryEntryCard diaryEntry={entry} showFullDate={false} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiaryMonthGroup;
