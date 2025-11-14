import React from "react";

interface ProductCardLoaderProps {
  index: number;
}

const CategorySectionLoader: React.FC<ProductCardLoaderProps> = ({ index }) => {
  return (
    <div
      className={`bg-white rounded-lg overflow-hidden transition-all duration-300 relative 
        shadow-[0px_0px_18.26px_0px_#00000014] cursor-pointer p-4
        ${index === 0 ? "col-span-2" : "col-span-1"}
      `}
    >
      {/* Image */}
      <div className="flex justify-center mb-4">
        <div className="h-[100px] w-[100px] bg-gray-200 rounded-md" />
      </div>

      {/* Title and Description */}
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>

      {/* Price */}
      <div className="mt-3 h-5 bg-gray-300 rounded w-20" />

      {/* Right side action buttons */}
      <div className="absolute right-4 top-1/3 transform -translate-y-1/2 flex flex-col gap-2">
        <div className="bg-gray-300 p-3 rounded-full w-10 h-10" />
        <div className="bg-gray-300 p-3 rounded-full w-10 h-10" />
        <div className="bg-gray-300 p-3 rounded-full w-10 h-10" />
      </div>
    </div>
  );
};

export default CategorySectionLoader;
