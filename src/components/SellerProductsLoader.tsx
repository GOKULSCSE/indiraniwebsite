import React from "react";

const ProductSkeleton = () => {
  return (
    <div className="rounded-lg shadow-md overflow-hidden bg-white border animate-pulse">
      <div className="w-full h-52 bg-gray-200"></div>
      <div className="p-4 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
