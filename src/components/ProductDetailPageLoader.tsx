import React from 'react'

function ProductDetailPageLoader() {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-12 mx-auto p-5 md:p-10 gap-6 animate-pulse">
                {/* First Grid - Product Images */}
                <div className="md:col-span-4">
                    <div className="sticky top-[11rem] rounded-lg shadow flex flex-col md:h-[500px] md:w-[500px] bg-gray-200" />

                    <div className="flex justify-center space-x-2 mt-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-12 h-12 bg-gray-300 rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Second Grid - Product Details */}
                <div className="md:col-span-5 space-y-4">
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <div className="h-6 bg-gray-300 rounded w-3/4" />
                        <div className="flex items-center space-x-2">
                            <div className="w-12 h-6 bg-gray-300 rounded" />
                            <div className="w-24 h-6 bg-gray-200 rounded" />
                        </div>
                        <div className="h-8 bg-gray-300 w-1/2 rounded" />
                        <div className="h-6 bg-gray-200 w-1/3 rounded" />

                        <div className="space-y-2">
                            <div className="h-5 w-1/3 bg-gray-300 rounded" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-5/6" />
                        </div>

                        {/* Variants */}
                        <div className="space-y-2">
                            <div className="h-5 w-1/3 bg-gray-300 rounded" />
                            <div className="grid grid-cols-2 gap-4">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="p-4 rounded-lg border-2 bg-gray-100 space-y-2">
                                        <div className="h-4 bg-gray-300 rounded w-2/3" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* About this product */}
                    <div className="bg-white p-4 rounded-lg shadow space-y-4">
                        <div className="h-5 w-1/3 bg-gray-300 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-5/6" />
                        <div className="h-4 bg-gray-200 rounded w-4/6" />
                    </div>
                </div>

                {/* Third Grid - Price and Actions */}
                <div className="md:col-span-3">
                    <div className="sticky top-[11rem] bg-white rounded-lg shadow p-6 space-y-4">
                        <div className="h-5 w-2/3 bg-gray-300 rounded" />
                        <div className="h-8 w-full bg-gray-300 rounded" />
                        <div className="h-5 w-1/3 bg-gray-200 rounded" />

                        <div className="space-y-4 pt-4">
                            <div className="h-10 bg-gray-400 w-full rounded-lg" />
                            <div className="h-10 bg-gray-300 w-full rounded-lg" />
                        </div>

                        <div className="mt-4 space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-2">
                                    <div className="w-5 h-5 bg-gray-300 rounded-full" />
                                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Similar Products Section */}
            <div className="mx-auto p-5 md:p-10 animate-pulse">
                <div className="h-6 bg-gray-300 w-1/4 rounded mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow-md h-72 w-full p-2 space-y-2">
                            <div className="h-48 bg-gray-200 rounded" />
                            <div className="h-4 bg-gray-300 w-3/4 rounded" />
                            <div className="h-4 bg-gray-200 w-1/2 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Ratings and Reviews Section */}
            <div className="mx-auto p-5 md:p-10 animate-pulse space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-300 w-1/4 rounded" />
                    <div className="h-10 bg-gray-200 w-32 rounded" />
                </div>

                <div className="bg-white p-6 rounded-lg shadow space-y-6">
                    <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
                        <div className="space-y-3">
                            <div className="h-5 w-3/4 bg-gray-300 rounded" />
                            <div className="h-6 w-1/4 bg-gray-300 rounded" />
                            <div className="h-4 w-2/3 bg-gray-200 rounded" />
                        </div>
                        <div className="space-y-2 w-full md:w-2/3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-4 bg-gray-200 rounded w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProductDetailPageLoader