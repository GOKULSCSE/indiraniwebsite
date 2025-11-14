"use client";
import React from "react";

export const ShipmentsSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 animate-pulse">
      {/* Header Section */}
      <div className="px-6 py-5 border-b border-gray-200/60">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 rounded w-40" />
            <div className="h-4 bg-gray-100 rounded w-60" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
            <div className="w-4 h-4 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex space-x-1 overflow-x-auto bg-gray-50 p-1 rounded-lg">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="px-4 py-2.5 text-sm font-medium rounded-md whitespace-nowrap flex items-center gap-2 bg-gray-200"
            >
              <div className="h-4 bg-gray-300 rounded w-16" />
              <div className="h-5 w-5 bg-gray-300 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left">
                <div className="w-4 h-4 bg-gray-200 rounded" />
              </th>
              {[...Array(7)].map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200/60">
            {[...Array(5)].map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-6 py-4">
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                </td>
                {[...Array(7)].map((_, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 