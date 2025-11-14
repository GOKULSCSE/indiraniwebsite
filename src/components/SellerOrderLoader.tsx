import React from "react";

const SellerOrderLoader = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Breadcrumb */}
      <div className="h-6 w-48 bg-gray-200 rounded ml-7 mt-6" />

      {/* Title */}
      <div className="h-8 w-32 bg-gray-300 rounded ml-7" />

      {/* Tabs Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex gap-4">
        {[1, 2, 3].map((_, idx) => (
          <div key={idx} className="h-10 w-36 bg-gray-200 rounded" />
        ))}
      </div>

      {/* Filter/Search/Sort Section */}
      <div className="bg-white p-7 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
        <div className="h-10 w-28 bg-gray-200 rounded" />
        <div className="flex-1 min-w-[200px] h-10 bg-gray-200 rounded" />
        <div className="h-10 w-28 bg-gray-200 rounded" />
        <div className="h-10 w-40 bg-gray-200 rounded" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {/* Table Headers */}
        <div className="flex w-full mb-4">
          {[50, 100, 200, 150, 100, 120, 120, 100].map((w, idx) => (
            <div key={idx} className={`h-4 bg-gray-300 rounded mr-4`} style={{ width: w }} />
          ))}
        </div>

        {/* Skeleton Rows */}
        <div className="space-y-4">
          {[...Array(3)].map((_, rowIdx) => (
            <div key={rowIdx} className="flex w-full items-center">
              {[50, 100, 200, 150, 100, 120, 120, 100].map((w, idx) => (
                <div key={idx} className={`h-6 bg-gray-200 rounded mr-4`} style={{ width: w }} />
              ))}
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-end items-center space-x-6 mt-6">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-gray-200 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
};

export default SellerOrderLoader;
