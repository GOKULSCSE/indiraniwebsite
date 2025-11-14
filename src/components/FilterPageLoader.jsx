import React from 'react'

const FilterPageLoader  = () => {
  return (
    <>
    <div className="grid md:grid-cols-4 gap-4">
      
      {/* Sidebar Skeleton */}
      <div className="hidden md:block col-span-1">
        <div className="p-6 border-r overflow-y-auto h-[calc(100vh-5rem)] animate-pulse space-y-6">
          <div className="h-6 bg-gray-300 rounded w-1/2" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-2/3" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
  
      {/* Products Section Skeleton */}
      <div className="col-span-4 md:col-span-3 h-[calc(100vh-5rem)] overflow-y-auto pr-2">
        {/* Top Controls Skeleton */}
        <div className="flex justify-between items-center mb-4 animate-pulse px-2">
          <div className="flex-1 space-y-2">
            <div className="h-8 bg-gray-200 rounded w-full" />
          </div>
          <div className="hidden md:block w-40 h-8 bg-gray-200 rounded" />
        </div>
  
        {/* Product Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border p-4 rounded shadow-sm space-y-3">
              <div className="w-full h-40 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-300 w-3/4 rounded" />
              <div className="h-3 bg-gray-200 w-1/2 rounded" />
              <div className="h-5 bg-gray-300 w-1/2 rounded" />
              <div className="flex space-x-1">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="w-4 h-4 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="w-full h-8 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>

    </div>
  </>
  
  )
}

export default FilterPageLoader 