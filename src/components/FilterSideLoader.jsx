import React from 'react'

const FilterSideLoader  = () => {
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
  
      

    </div>
  </>
  
  )
}

export default FilterSideLoader 