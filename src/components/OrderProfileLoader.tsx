import React from "react";

const OrderProfileLoader: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="w-[60px] h-[60px] rounded-md bg-gray-300 border" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-gray-300 rounded" />
            <div className="h-3 w-48 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderProfileLoader;
