import React from 'react'

const ShippingPageLoader = () => {
  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 w-full animate-pulse">
    <div className="md:col-span-3 space-y-4">
      {/* Tabs Skeleton */}
      <div className="flex w-full bg-gray-200 rounded-full overflow-hidden">
        <div className="flex-1 py-3 bg-gray-300"></div>
        <div className="flex-1 py-3 bg-gray-300 ml-1"></div>
      </div>
  
      {/* Content Skeleton */}
      <div className="p-6 border rounded-lg bg-white shadow space-y-4">
        {/* Add New Button */}
        <div className="flex justify-end">
          <div className="w-24 h-8 bg-gray-300 rounded-md"></div>
        </div>
  
        {/* Address cards skeleton */}
        <div className="space-y-4">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="p-4 border rounded-2xl shadow bg-gray-100 space-y-2">
              <div className="flex justify-end gap-2">
                <div className="w-12 h-6 bg-gray-300 rounded-md"></div>
                <div className="w-12 h-6 bg-gray-300 rounded-md"></div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  
    {/* Payment Summary Skeleton */}
    <div className="md:col-span-1">
      <div className="bg-gray-50 p-4 rounded-lg shadow space-y-4">
        <div className="h-6 bg-gray-300 rounded w-2/3"></div>
        <hr className="border-gray-300" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
            <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
        <hr className="border-gray-300" />
        <div className="flex justify-between pt-2">
          <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
          <div className="w-1/4 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  </div>
  
    </>
  )
}

export default ShippingPageLoader