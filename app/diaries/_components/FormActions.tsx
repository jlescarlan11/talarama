import React from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "./LoadingSpinner";

interface FormActionsProps {
  isSubmitting: boolean;
  isEditMode: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  isSubmitting,
  isEditMode,
}) => {
  const router = useRouter();

  return (
    <div className="flex justify-end gap-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        disabled={isSubmitting}
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" />
            {isEditMode ? "Updating..." : "Saving..."}
          </>
        ) : isEditMode ? (
          "Update Entry"
        ) : (
          "Save Entry"
        )}
      </button>
    </div>
  );
};
