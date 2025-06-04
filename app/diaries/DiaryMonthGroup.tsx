// components/DiaryMonthGroup.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DiaryEntryWithMovie } from "./types/diary";
import DiaryEntryCard from "./DiaryEntryCard";
import DiaryEntryViewModal from "./DiaryEntryViewModal";
import DiaryEntryDeleteButton from "./DiaryEntryDeleteButton";

interface DiaryMonthGroupProps {
  monthYear: string;
  entries: DiaryEntryWithMovie[];
  totalMovies: number;
  isFirstGroup?: boolean;
  isLastGroup?: boolean;
}

const DiaryMonthGroup: React.FC<DiaryMonthGroupProps> = ({
  monthYear,
  entries,
  isFirstGroup = false,
}) => {
  const router = useRouter();
  const [viewModalEntry, setViewModalEntry] =
    useState<DiaryEntryWithMovie | null>(null);
  const [deleteModalEntry, setDeleteModalEntry] =
    useState<DiaryEntryWithMovie | null>(null);

  const handleView = (entry: DiaryEntryWithMovie): void => {
    setViewModalEntry(entry);
  };

  const handleEdit = (entry: DiaryEntryWithMovie): void => {
    router.push(`/diaries/edit/${entry.id}`);
  };

  const handleDelete = (entry: DiaryEntryWithMovie): void => {
    setDeleteModalEntry(entry);
  };

  const handleCloseViewModal = (): void => {
    setViewModalEntry(null);
  };

  const handleCloseDeleteModal = (): void => {
    setDeleteModalEntry(null);
  };

  return (
    <>
      <div
        className={`pb-4 ${
          !isFirstGroup ? "border-t border-gray-200 pt-4" : ""
        } `}
      >
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

              {/* Entry content spans remaining columns */}
              <div className="col-span-10">
                <DiaryEntryCard
                  diaryEntry={entry}
                  showFullDate={false}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Modal */}
      {viewModalEntry && (
        <DiaryEntryViewModal
          entry={viewModalEntry}
          onClose={handleCloseViewModal}
        />
      )}

      {/* Delete Component */}
      {deleteModalEntry && (
        <DiaryEntryDeleteButton
          entry={deleteModalEntry}
          onClose={handleCloseDeleteModal}
        />
      )}
    </>
  );
};

export default DiaryMonthGroup;
