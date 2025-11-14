import React from 'react'

const DashboardLoader = () => {
  return (
    <>
    <div className="relative">
      {/* CustomAlert Skeleton */}
      <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse"></div>
      
      {/* Banner Skeleton */}
      <div className="relative flex items-center justify-between w-full h-[300px] bg-gray-200 rounded-lg shadow-lg mx-auto animate-pulse">
        {/* Left side skeleton */}
        <div className="relative z-10 max-w-md ml-15 space-y-4">
          <div className="h-8 w-3/4 bg-gray-300 rounded"></div>
          <div className="h-6 w-2/3 bg-gray-300 rounded"></div>
          <div className="h-10 w-24 bg-gray-300 rounded"></div>
        </div>
        
        {/* Right side skeleton */}
        <div className="relative z-10 w-[500px] h-[300px] bg-gray-300 rounded-lg"></div>
      </div>
  
      {/* Analytic Overview Title */}
      <div className="h-8 w-48 bg-gray-200 rounded mt-10 mb-6 animate-pulse"></div>
      
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white shadow-lg rounded-lg p-6 animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="flex items-center mt-1">
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  <div className="ml-2 h-6 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            <br />
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
  
      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 space-y-4">
        {/* Left chart section */}
        <div className="col-span-8 flex flex-col p-4">
          <div className="flex flex-row items-center justify-between">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex space-x-3">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="w-full h-[300px] bg-gray-200 rounded mt-20 animate-pulse"></div>
        </div>
        
        {/* Right chart section */}
        <div className="col-span-4 px-7 p-4">
          <div className="flex flex-row items-center justify-between">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow w-full h-[90%] mt-2 animate-pulse">
            <div className="mb-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-8 w-32 bg-gray-200 rounded mt-2"></div>
            </div>
            <div className="w-full h-[300px] bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
  
      {/* Recent Orders Skeleton */}
      <div className="space-y-4 p-4">
        <div className="flex flex-row items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
        
        <div className="w-full h-full mt-6">
          <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
            {/* Table header skeleton */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6].map((col) => (
                <div key={col} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            
            {/* Table rows skeleton */}
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="grid grid-cols-6 gap-4 mb-4">
                <div className="h-12 bg-gray-100 rounded"></div>
                <div className="h-12 bg-gray-100 rounded"></div>
                <div className="h-12 bg-gray-100 rounded"></div>
                <div className="h-12 bg-gray-100 rounded"></div>
                <div className="h-12 bg-gray-100 rounded"></div>
                <div className="h-12 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>

  )
}

export default DashboardLoader