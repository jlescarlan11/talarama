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

const DiaryMonthGroup: React.FC<DiaryMonthGroupProps> = ({ entries }) => {
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
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="grid grid-cols-12 gap-4 items-center py-4 border-b border-white/10 last:border-b-0"
          >
            {/* Day of the Month */}
            <div className="col-span-2 flex flex-col items-center">
              <span className="text-3xl font-bold text-accent drop-shadow-lg">
                {new Date(entry.watchedDate).getDate()}
              </span>
              <span className="text-xs text-white/50 mt-1">Day</span>
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
