import React from 'react'

const CartLoader = () => {
  return (
    <>
  <div className="min-h-screen bg-gray-50 p-4 animate-pulse">
    <h1 className="text-2xl font-bold mb-4 bg-gray-300 h-6 w-48 rounded"></h1>
    <div className="container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cart Table Skeleton (Desktop) */}
        <div className="col-span-3 bg-white p-4 rounded-lg shadow w-full hidden md:block">
          <div className="overflow-x-auto w-full">
            <div className="w-full min-w-[600px]">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-4 items-center gap-4 py-4 border-t">
                  <div className="w-24 h-24 bg-gray-200 rounded mx-auto"></div>
                  <div className="space-y-2 text-left">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-3 bg-gray-100 rounded w-3/4 mx-auto"></div>
                    <div className="h-6 bg-red-100 rounded w-20 mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Card Skeleton (Mobile) */}
        <div className="md:hidden space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-6 w-20 bg-red-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Skeleton */}
        <div className="bg-white p-4 rounded-lg shadow w-full">
          <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
            <div className="flex justify-between items-center font-semibold border-t pt-2">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
            <div className="w-full h-10 bg-blue-200 rounded mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</>

  )
}

export default CartLoader