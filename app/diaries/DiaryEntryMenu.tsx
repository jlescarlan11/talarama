"use client";
// components/DiaryEntryMenu.tsx
import React, { useState, useRef, useEffect } from "react";
import { PiDotsThreeVertical, PiEye, PiPencil, PiTrash } from "react-icons/pi";

import { DiaryEntryWithMovie } from "./types/diary";

interface DiaryEntryMenuProps {
  diaryEntry: DiaryEntryWithMovie;
  onView?: (entry: DiaryEntryWithMovie) => void;
  onEdit?: (entry: DiaryEntryWithMovie) => void;
  onDelete?: (entry: DiaryEntryWithMovie) => void;
}

const DiaryEntryMenu: React.FC<DiaryEntryMenuProps> = ({
  diaryEntry,
  onView,
  onEdit,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleToggle = (): void => {
    setIsOpen(!isOpen);
  };

  const handleMenuAction = (action: () => void): void => {
    action();
    setIsOpen(false);
  };

  const handleView = (): void => {
    if (onView) {
      handleMenuAction(() => onView(diaryEntry));
    }
  };

  const handleEdit = (): void => {
    if (onEdit) {
      handleMenuAction(() => onEdit(diaryEntry));
    }
  };

  const handleDelete = (): void => {
    if (onDelete) {
      handleMenuAction(() => onDelete(diaryEntry));
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors"
        aria-label="Entry options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <PiDotsThreeVertical className="text-base-content/60 hover:text-base-content" />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-1 z-50 w-48 bg-base-100 rounded-lg shadow-lg border border-base-300 py-1"
          role="menu"
          aria-label="Entry actions"
        >
          {onView && (
            <button
              onClick={handleView}
              className="flex items-center w-full px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors"
              role="menuitem"
            >
              <PiEye className="mr-3 text-base" />
              View Details
            </button>
          )}

          {onEdit && (
            <button
              onClick={handleEdit}
              className="flex items-center w-full px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors"
              role="menuitem"
            >
              <PiPencil className="mr-3 text-base" />
              Edit Entry
            </button>
          )}

          {onDelete && (
            <>
              {(onView || onEdit) && (
                <div className="border-t border-base-300 my-1" />
              )}
              <button
                onClick={handleDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                role="menuitem"
              >
                <PiTrash className="mr-3 text-base" />
                Delete Entry
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DiaryEntryMenu;
