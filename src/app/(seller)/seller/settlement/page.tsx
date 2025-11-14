"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";

interface SellerPayment {
  id: string;
  orderId: string;
  formattedOrderId?: string; // Add this new field for backward compatibility
  sellerId: string;
  storeName: string;
  productName: string;
  productBrand: string;
  variantTitle: string;
  productTotal: number;
  discountAmount: number;
  gstAmount: number;
  shippingCharge: number;
  commissionPercentage: number;
  commissionAmount: number;
  finalAmount: number;
  settlementAmount: number;
  isSettlement: boolean;
  createdAt: string;
  updatedAt: string;
  productImage: string | null;
  utrNumber: string | null;
}

interface ApiResponse {
  data: SellerPayment[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

// Settlement Table Skeleton Loader
const SettlementSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UTR Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Skeleton Pagination */}
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Filter Tabs Component
const FilterTabs = ({ tabs, activeTab, onChange }: {
  tabs: Array<{ id: string; label: string; }>;
  activeTab: string;
  onChange: (tabId: string) => void;
}) => {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// Custom Pagination Component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  pageSize, 
  onPageSizeChange,
  totalCount 
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalCount: number;
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {totalCount} results
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor="page-size" className="text-sm">
          Rows per page:
        </Label>
        <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function SettlementPage() {
  const { data: session, status } = useSession();
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [settlementStatus, setSettlementStatus] = useState<string>("pending");
  const [data, setData] = useState<SellerPayment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Settlement status filter tabs
  const settlementFilterTabs = [
    { id: "pending", label: "Pending" },
    { id: "paid", label: "Paid" },
    { id: "all", label: "All" },
  ];

  // Handle settlement tab change
  const handleSettlementTabChange = (tabId: string) => {
    setSettlementStatus(tabId);
    setPageIndex(0); // Reset to first page
  };

  // Fetch settlement data
  const fetchSettlementData = async () => {
    if (status === "loading") return;
    
    if (!session?.user?.sellerId) {
      toast.error("Seller authentication required");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        settlementStatus,
        sellerId: session.user.sellerId, // Add seller ID to filter by current seller
      });

      // Add search parameter if search query exists
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      const response = await fetch(`/api/seller/settlement?${params}`, {
        headers: {
          'x-user': JSON.stringify({
            id: session.user.id,
            sellerId: session.user.sellerId
          })
        }
      });
      const result = await response.json();

      if (result.status === "success") {
        setData(result.data.data);
        setTotalCount(result.data.pagination.totalCount);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast.error("Failed to fetch settlement data");
      }
    } catch (error) {
      console.error("Error fetching settlement data:", error);
      toast.error("Failed to fetch settlement data");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPageIndex(0); // Reset to first page when search changes
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    if (status === "authenticated" && session?.user?.sellerId) {
      fetchSettlementData();
    }
  }, [pageIndex, pageSize, settlementStatus, debouncedSearchQuery, status, session?.user?.sellerId]);

  // Handle bulk payment status update
  const handleBulkPayment = async (action: "mark_paid" | "mark_pending") => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to update");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/seller/settlement", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'x-user': JSON.stringify({
            id: session?.user?.id,
            sellerId: session?.user?.sellerId
          })
        },
        body: JSON.stringify({
          orderItemIds: selectedItems,
          action,
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        toast.success(result.message);
        setSelectedItems([]);
        fetchSettlementData(); // Refresh data
      } else {
        toast.error(result.message || "Failed to update settlement status");
      }
    } catch (error) {
      console.error("Error updating settlement status:", error);
      toast.error("Failed to update settlement status");
    } finally {
      setLoading(false);
    }
  };

  // Handle individual checkbox change
  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(data.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // Check if all items are selected
  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < data.length;

  // Utility function to truncate text
  const truncateText = (text: string, maxLength: number = 20) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-white p-4 rounded-md border">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if not authenticated or not a seller
  if (status !== "authenticated" || !session?.user?.sellerId) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-white p-4 rounded-md border">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">Authentication required</div>
            <div className="text-gray-500">Please log in as a seller to view settlement data</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="bg-white p-4 rounded-md border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="font-bold text-lg">My Settlement</div>
            <div className="text-sm text-gray-600">Manage your product settlements and payments</div>
          </div>
          {selectedItems.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleBulkPayment("mark_paid")}
                size="sm"
                disabled={loading}
              >
                Mark {selectedItems.length} as Paid
              </Button>
              <Button
                onClick={() => handleBulkPayment("mark_pending")}
                size="sm"
                variant="outline"
                disabled={loading}
              >
                Mark {selectedItems.length} as Pending
              </Button>
            </div>
          )}
        </div>

        {/* Settlement Status Filter Tabs */}
        <div className="mb-4">
          <FilterTabs
            tabs={settlementFilterTabs}
            activeTab={settlementStatus}
            onChange={handleSettlementTabChange}
          />
        </div>

        {/* Search and Filters */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                Search Products
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by product, brand, variant, or order ID (e.g., 100-1)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSettlementStatus("pending");
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setPageIndex(0);
                }}
                disabled={settlementStatus === "pending" && !searchQuery && !debouncedSearchQuery}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Filter Summary */}
          {(settlementStatus !== "pending" || debouncedSearchQuery) && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {data.length} of {totalCount} settlements for your store
              {settlementStatus !== "pending" && (
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  Status: {settlementStatus}
                </span>
              )}
              {debouncedSearchQuery && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Search: "{debouncedSearchQuery}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Custom Table with Skeleton Loader */}
        {loading ? (
          <SettlementSkeleton rows={pageSize} />
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {/* <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className={isPartiallySelected ? "data-[state=checked]:bg-blue-600" : ""}
                      />
                    </th> */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UTR Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {/* <td className="px-4 py-4">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => handleCheckboxChange(item.id, !!checked)}
                        />
                      </td> */}
                      <td className="px-4 py-4">
                        <div className="font-mono text-xs" title={item.orderId}>
                          {item.orderId}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded-md border"
                            />
                          )}
                          <div>
                            <div className="font-medium" title={item.productName}>
                              {truncateText(item.productName, 25)}
                            </div>
                            {item.variantTitle && (
                              <div className="text-sm text-gray-500" title={item.variantTitle}>
                                {truncateText(item.variantTitle, 20)}
                              </div>
                            )}
                            {item.productBrand && (
                              <div className="text-xs text-gray-400" title={item.productBrand}>
                                {truncateText(item.productBrand, 15)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>₹{item.productTotal.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div>₹{item.gstAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div>₹{item.shippingCharge.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div>₹{item.commissionAmount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">({item.commissionPercentage}%)</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold">₹{item.finalAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono text-sm" title={item.utrNumber || "No UTR available"}>
                          {item.utrNumber ? truncateText(item.utrNumber, 12) : "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={item.isSettlement ? "default" : "secondary"}>
                          {item.isSettlement ? "Paid" : "Pending"}
                        </Badge>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-500">No settlement data found</div>
              </div>
            )}

            {/* Custom Pagination */}
            {totalCount > 0 && (
              <Pagination
                currentPage={pageIndex + 1}
                totalPages={totalPages}
                onPageChange={(page) => setPageIndex(page - 1)}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPageIndex(0);
                }}
                totalCount={totalCount}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}