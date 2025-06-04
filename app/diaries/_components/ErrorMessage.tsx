import React from "react";

interface ErrorMessageProps {
  error?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div
      className="bg-red-50 border border-red-200 rounded-lg p-4"
      role="alert"
    >
      <p className="text-red-800 text-sm">{error}</p>
    </div>
  );
};
