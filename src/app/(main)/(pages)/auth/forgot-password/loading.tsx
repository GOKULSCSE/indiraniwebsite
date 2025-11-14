import React from 'react'

function loading() {
  return (
    <>
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-2/3 mx-auto mb-6" />

      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="h-10 bg-gray-300 rounded w-full" />
      </div>
    </div>
  </div>
</>

  )
}

export default loading