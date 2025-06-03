// components/LoadingSpinner.tsx
import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
  );
};

export default LoadingSpinner;
