import React from 'react'

const WishlistLoader  = () => {
  return (
    <>
    <div className="min-h-screen bg-gray-50 p-4 animate-pulse">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-300">Loading Wishlist...</h1>
      

      <div className="flex justify-center w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:w-full p-6">
          {[1, 2, 3, 4].map((_, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-lg shadow relative"
            >
              <div className="absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full" />

              <div className="flex gap-4">
                <div className="w-50 h-32 bg-gray-200 rounded mx-auto" />

                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-4 bg-gray-300 rounded" />
                    <div className="w-20 h-3 bg-gray-200 rounded" />
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />

                  <div className="mt-4 h-10 bg-gray-300 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div></>
  )
}

export default WishlistLoader 