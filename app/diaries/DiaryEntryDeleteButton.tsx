// components/DiaryEntryDeleteButton.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { DiaryEntryWithMovie } from "./types/diary";
import { Spinner } from "@/app/components";

interface DiaryEntryDeleteButtonProps {
  entry: DiaryEntryWithMovie;
  onClose: () => void;
}

const DiaryEntryDeleteButton: React.FC<DiaryEntryDeleteButtonProps> = ({
  entry,
  onClose,
}) => {
  const router = useRouter();
  const [error, setError] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const deleteDiaryEntry = async (): Promise<void> => {
    try {
      setIsDeleting(true);
      await axios.delete(`/api/diaries/${entry.id}`);
      onClose();
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error("Unexpected error occurred:", error);
      setError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Confirm Deletion Modal */}
      <div className="modal modal-open" role="dialog">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Delete Diary Entry</h3>
          <div className="py-4">
            <p className="mb-3">
              Are you sure you want to delete your diary entry for{" "}
              <span className="font-semibold">
                &quot;{entry.movie.title}&quot;
              </span>
              ?
            </p>
            <p className="text-sm text-base-content/70">
              This action cannot be undone. Your review and rating will be
              permanently removed.
            </p>
          </div>
          <div className="modal-action flex justify-end gap-2">
            <button className="btn" onClick={onClose} disabled={isDeleting}>
              Cancel
            </button>
            <button
              onClick={deleteDiaryEntry}
              disabled={isDeleting}
              className="btn btn-error"
            >
              {isDeleting ? (
                <>
                  Deleting <Spinner />
                </>
              ) : (
                "Delete Entry"
              )}
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="modal modal-open" role="dialog">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Error</h3>
            <p className="py-4">This diary entry could not be deleted.</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setError(false)}>
                Okay
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setError(false)}></div>
        </div>
      )}
    </>
  );
};

export default DiaryEntryDeleteButton;
