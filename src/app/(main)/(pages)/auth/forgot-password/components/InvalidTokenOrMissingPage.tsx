"use client";
import React from 'react'
import { useRouter } from 'next/navigation'

function InvalidTokenOrMissingPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-6 text-red-600">Invalid Token or Missing Page</h2>

        <div className="p-4 bg-red-100 text-red-700 text-center rounded-md mb-4">
          The link you followed may have expired or is invalid.
        </div>

        <button
          onClick={() => router.push('/auth/signin')}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default InvalidTokenOrMissingPage
