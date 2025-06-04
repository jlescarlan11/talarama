import React from "react";
import { Skeleton } from "@/app/components";

const NewDiaryLoading = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <Skeleton height={36} width={280} className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Form inputs */}
          <div className="lg:col-span-2">
            <div className="card shadow-sm">
              <div className="card-body space-y-6">
                <Skeleton height={24} width={120} className="mb-6" />

                {/* Movie search and date row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Skeleton height={20} width={80} className="mb-2" />
                    <Skeleton height={44} width="100%" />
                  </div>
                  <div>
                    <Skeleton height={20} width={100} className="mb-2" />
                    <Skeleton height={44} width="100%" />
                  </div>
                </div>

                {/* Review textarea */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Skeleton height={20} width={80} />
                    <Skeleton height={16} width={60} />
                  </div>
                  <Skeleton height={256} width="100%" />
                </div>

                {/* Star rating */}
                <div>
                  <Skeleton height={20} width={80} className="mb-2" />
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} height={32} width={32} circle />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Movie preview */}
          <div className="lg:col-span-1">
            <div className="card shadow-sm sticky top-6">
              <div className="card-body">
                <Skeleton height={24} width={120} className="mb-4" />
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden">
                  <Skeleton height="100%" className="rounded-lg" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <Skeleton height={20} width="75%" className="mb-2" />
                    <Skeleton height={16} width="50%" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex justify-end gap-4 mt-8">
          <Skeleton height={44} width={100} />
          <Skeleton height={44} width={120} />
        </div>
      </div>
    </div>
  );
};

export default NewDiaryLoading; 