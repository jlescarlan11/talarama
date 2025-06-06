import React from "react";
import { Skeleton } from "@/app/components";

const DiaryLoading = () => {
  return (
    <div className="bg-base-100 text-base-content">
      <div className="rounded-2xl shadow-lg p-8 mb-8 bg-base-200 flex flex-col md:flex-row items-center gap-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8 w-full">
          <Skeleton circle height={100} width={100} />
          <div className="flex flex-col items-center md:items-start gap-1">
            <Skeleton height={32} width={200} />
          </div>
        </div>
        <div className="flex flex-row sm:gap-12 w-full justify-center items-center">
          {[1, 2].map((_, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <div className="h-10 w-px bg-base-content/30 mx-6" />}
              <div className="flex flex-col items-center sm:min-w-[120px]">
                <div className="flex items-center gap-3 mb-1">
                  <Skeleton height={40} width={40} />
                  <Skeleton height={40} width={80} />
                </div>
                <Skeleton height={24} width={100} />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="border-b border-base-content/10 mb-4"></div>
      <div>
        <div className="flex gap-4 mb-6">
          <Skeleton height={40} width={120} />
          <Skeleton height={40} width={120} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <Skeleton height={200} className="rounded-lg mb-4" />
                <Skeleton height={24} width="75%" className="mb-2" />
                <Skeleton height={20} width="50%" className="mb-4" />
                <div className="flex gap-2">
                  <Skeleton height={32} width={80} />
                  <Skeleton height={32} width={80} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiaryLoading; 