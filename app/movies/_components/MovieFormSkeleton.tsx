import React from "react";
import { FormFieldSkeleton } from "@/app/components/Skeleton";

const MovieFormSkeleton = () => {
  return (
    <div className="space-y-6">
      <FormFieldSkeleton />
      <FormFieldSkeleton />
      <FormFieldSkeleton />
      <FormFieldSkeleton />
      <FormFieldSkeleton />
      <div className="flex justify-end">
        <div className="w-24">
          <FormFieldSkeleton />
        </div>
      </div>
    </div>
  );
};

export default MovieFormSkeleton;
