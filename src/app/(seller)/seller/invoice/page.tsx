"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { ChevronLeft, ChevronRight, Search, Filter, Upload, FileText, Download, X } from "lucide-react";
import { S3Storage } from "@/lib/s3";

interface SellerPayment {
  id: string;
  orderId: string;
  formattedOrderId?: string; // Add this new field for backward compatibility
  sellerId: string;
  storeName: string;
  productName: string;
  productBrand: string;
  variantTitle: string;
  priceAtPurchase: number;
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
  // Customer information
  customerName: string;
  customerEmail: string | null;
  customerId: string | null;
  // Invoice related fields
  invoiceStatus: "pending" | "sellerUploaded" | "adminUploaded";
  sellerInvoice: string | null;
  sellerEway: string | null;
  adminInvoice: string | null;
  adminEway: string | null;
  // Order date
  orderDate: string;
  // AWB information
  awb: string | null;
  shipmentId: number | null;
  labelUrl: string | null;
  hasShipment: boolean;
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

// Document File Upload Component for Invoice/Eway documents
interface DocumentUploadProps {
  onUploadSuccess: (url: string) => void;
  existingFileUrl?: string | null;
  label: string;
  disabled?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadSuccess,
  existingFileUrl,
  label,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(existingFileUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const s3Storage = new S3Storage("invoices");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type (PDF, DOC, DOCX)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload PDF, DOC, or DOCX files only");
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      
      // Create unique filename with timestamp to prevent caching issues
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      
      // Create a buffer from the file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Upload to S3
      const url = await s3Storage.uploadFile({
        file: buffer,
        fileName: uniqueFileName,
        contentType: file.type,
      });

      // Important: Update the state with the new URL
      setUploadedFileUrl(url);
      
      // Send the URL to parent component
      onUploadSuccess(url);
      
      const actionText = existingFileUrl ? "replaced" : "uploaded";
      toast.success(`${label} ${actionText} successfully`);
      
      // Reset the input to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(`Failed to upload ${label}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (uploadedFileUrl || existingFileUrl) {
      window.open(uploadedFileUrl || existingFileUrl!, '_blank');
    }
  };

  const displayUrl = uploadedFileUrl || existingFileUrl;

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      {!displayUrl ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
          <div className="flex flex-col items-center text-center">
            <Button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              variant="ghost"
              size="sm"
              disabled={disabled || isUploading}
              className="p-2 bg-gray-100 hover:bg-gray-200"
            >
              {isUploading ? <span className="animate-spin">⏳</span> : <Upload className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
          <Button
            type="button"
            onClick={handleDownload}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100"
          >
            <Download className="h-5 w-5" />
          </Button>
          
          {!disabled && (
            <Button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              variant="ghost" 
              size="sm"
              disabled={isUploading}
              className="p-2 bg-gray-100 hover:bg-gray-200"
            >
              {isUploading ? <span className="animate-spin">⏳</span> : <Upload className="h-5 w-5" />}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Invoice Table Skeleton Loader
const InvoiceSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <>
      {/* Desktop Table Skeleton */}
      <div className="hidden lg:block border rounded-lg overflow-hidden">
      <div className="">
          <table className="w-full ">
          <thead className="bg-gray-50 border-b">
            <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Item</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Total</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Amount</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Status</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Print AWB</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Invoice</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Eway</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Invoice</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Eway</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-4">
                      <Skeleton className="h-4 w-14" />
                </td>
                                        <td className="px-2 py-4">
                      <div className="flex items-center gap-1">
                        <Skeleton className="w-8 h-8 rounded" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </td>
                                        <td className="px-2 py-4">
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-18" />
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <Skeleton className="h-3 w-14" />
                </td>
                    <td className="px-2 py-4">
                  <div className="space-y-1">
                        <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </td>
                    <td className="px-2 py-4">
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="px-2 py-4">
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </td>
                    <td className="px-2 py-4">
                      <Skeleton className="h-3 w-10" />
                    </td>
                    <td className="px-2 py-4">
                      <Skeleton className="h-3 w-10" />
                    </td>
                    <td className="px-2 py-4">
                      <Skeleton className="h-3 w-10" />
                    </td>
                    <td className="px-2 py-4">
                      <Skeleton className="h-3 w-10" />
                </td>
                    <td className="px-2 py-4">
                      <Skeleton className="h-3 w-10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="lg:hidden space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
            {/* Header */}
            <div className="flex gap-3 mb-3">
              <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Customer and Date */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            {/* Invoice Links */}
            <div className="grid grid-cols-2 gap-4 border-t pt-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* ID */}
            <div className="mt-3 pt-2 border-t">
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Skeleton Pagination */}
      <div className="mt-4 flex items-center justify-between px-2 py-4 bg-white border rounded-lg">
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
    </>
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
  const [invoiceStatus, setInvoiceStatus] = useState<string>("all");
  const [data, setData] = useState<SellerPayment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Invoice status filter tabs
  // Status logic:
  // - pending: No seller invoice and no admin invoice
  // - sellerUploaded: Seller invoice exists but no admin invoice  
  // - adminUploaded: Admin invoice exists (regardless of seller invoice status)
  // Note: E-way bills do not affect invoice status
  const invoiceStatusTabs = [
    { id: "pending", label: "Pending" },
    { id: "sellerUploaded", label: "Seller Invoice" },
    { id: "adminUploaded", label: "Admin Invoice" },
    { id: "all", label: "All" },
  ];

  // Handle invoice status tab change
  const handleInvoiceStatusTabChange = (tabId: string) => {
    setInvoiceStatus(tabId);
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
        sellerId: session.user.sellerId, // Add seller ID to filter by current seller
      });

      // Add invoice status filter
      if (invoiceStatus !== 'all') {
        params.append("invoiceStatus", invoiceStatus);
      }

      // Add search parameter if search query exists
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      const response = await fetch(`/api/seller/invoice?${params}`, {
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
  }, [pageIndex, pageSize, invoiceStatus, debouncedSearchQuery, status, session?.user?.sellerId]);

  // Periodically check for admin invoice updates to keep status chips current
  // This ensures that when admin uploads invoices from external sources, the status chips
  // automatically update to show "Admin Invoice" without requiring manual refresh
  useEffect(() => {
    if (status === "authenticated" && session?.user?.sellerId && data.length > 0) {
      const interval = setInterval(() => {
        // Only refresh if we're not currently loading
        if (!loading) {
          fetchSettlementData();
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [status, session?.user?.sellerId, data.length, loading]);

  // Handle file upload for seller invoice/eway
  const handleFileUpload = async (orderItemId: string, field: 'sellerInvoice' | 'sellerEway', fileUrl: string) => {
    // If empty URL (which shouldn't happen with our improved upload), skip API call
    if (!fileUrl) {
      console.log("Empty file URL provided, skipping update");
      return;
    }
    
    try {
      const response = await fetch("/api/seller/invoice", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'x-user': JSON.stringify({
            id: session?.user?.id,
            sellerId: session?.user?.sellerId
          })
        },
        body: JSON.stringify({
          orderItemId,
          field,
          fileUrl,
        }),
      });

      const result = await response.json();

      // Show API response in console and toast
      console.log("API Response:", result);
      
      if (result.status === "success") {
        // Update the local data to reflect changes immediately without a full reload
        setData(prevData => 
          prevData.map(item => {
            if (item.id === orderItemId) {
              const updatedItem = { ...item, [field]: fileUrl };
              
              // Update invoice status when API returns new status
              if (result.data?.invoiceStatus) {
                updatedItem.invoiceStatus = result.data.invoiceStatus;
                
                // Show appropriate success message based on the new status
                if (result.data.invoiceStatus === "adminUploaded") {
                  toast.success("Invoice uploaded successfully. Status: Admin Invoice");
                } else if (result.data.invoiceStatus === "sellerUploaded") {
                  toast.success("Invoice uploaded successfully. Status: Seller Invoice");
                } else {
                  toast.success("Invoice uploaded successfully. Status: Pending");
                }
              } else if (field === 'sellerInvoice') {
                // If API doesn't return status but invoice is uploaded, show success
                toast.success("Invoice uploaded successfully");
              } else if (field === 'sellerEway') {
                // For eway uploads, just show success without status change
                toast.success("E-way bill uploaded successfully");
              }
              
              return updatedItem;
            }
            return item;
          })
        );
        
        // Refresh data to ensure we have the latest status from server
        setTimeout(() => {
          fetchSettlementData();
        }, 1000);
      } else {
        toast.error(result.message || "Failed to save file reference");
        console.error("API Error:", result);
      }
    } catch (error) {
      console.error("Error saving file reference:", error);
      toast.error("Failed to save file reference. Please try again.");
    }
  };

  // Function to update local state when admin invoice is uploaded from external source
  // This ensures the status chip automatically changes to "Admin Invoice" when admin uploads
  const updateAdminInvoiceStatus = (orderItemId: string, adminInvoiceUrl: string | null) => {
    setData(prevData => 
      prevData.map(item => {
        if (item.id === orderItemId) {
          const updatedItem = { ...item, adminInvoice: adminInvoiceUrl };
          
          // Update invoice status based on presence of admin invoice
          // Only consider admin invoice if it has a valid URL (not empty string)
          if (adminInvoiceUrl && adminInvoiceUrl.trim() !== "") {
            updatedItem.invoiceStatus = "adminUploaded";
          } else {
            // If admin invoice is removed or empty, check seller invoice status
            if (item.sellerInvoice && item.sellerInvoice.trim() !== "") {
              updatedItem.invoiceStatus = "sellerUploaded";
            } else {
              updatedItem.invoiceStatus = "pending";
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Handle bulk payment status update
  const handleBulkPayment = async (action: "mark_paid" | "mark_pending") => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to update");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/seller/invoice", {
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

  // Utility function to format invoice status
  const formatInvoiceStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "sellerUploaded":
        return "Seller Invoice";
      case "adminUploaded":
        return "Admin Invoice";
      default:
        return "Unknown";
    }
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
            <div className="font-bold text-lg">My Invoice</div>
            <div className="text-sm text-gray-600">Manage your product invoices</div>
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

        {/* Invoice Status Filter Tabs */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-500 mb-2">Invoice Status:</div>
          <FilterTabs
            tabs={invoiceStatusTabs}
            activeTab={invoiceStatus}
            onChange={handleInvoiceStatusTabChange}
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
                  setInvoiceStatus("all");
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setPageIndex(0);
                }}
                disabled={
                  invoiceStatus === "all" && 
                  !searchQuery && 
                  !debouncedSearchQuery
                }
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Filter Summary */}
          {(invoiceStatus !== "all" || debouncedSearchQuery) && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {data.length} of {totalCount} invoices for your store
              {invoiceStatus !== "all" && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  Status: {invoiceStatus === "pending" ? "Pending" : 
                           invoiceStatus === "sellerUploaded" ? "Seller Invoice" : "Admin Invoice"}
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
          <InvoiceSkeleton rows={pageSize} />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                          <thead className="bg-gray-50 border-b">
            <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Item</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Total</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Amount</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Status</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Print AWB</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Invoice</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Eway</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Invoice</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Eway</th>
            </tr>
          </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-2 py-4">
                        <div className="font-mono text-xs" title={item.orderId}>
                            {item.orderId}
                        </div>
                      </td>
                                                <td className="px-2 py-4">
                          <div className="flex items-center gap-1">
                            {item.productImage && (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-8 h-8 object-cover rounded border flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-xs truncate" title={item.productName}>
                                {truncateText(item.productName, 12)}
                              </div>
                              {item.variantTitle && (
                                <div className="text-xs text-gray-500 truncate" title={item.variantTitle}>
                                  {truncateText(item.variantTitle, 10)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          <div className="min-w-0">
                            <div className="font-medium text-xs truncate" title={item.customerName}>
                              {truncateText(item.customerName, 10)}
                            </div>
                            {item.customerEmail && (
                              <div className="text-xs text-gray-500 truncate" title={item.customerEmail}>
                                {truncateText(item.customerEmail, 12)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          <div className="text-xs">
                            {new Date(item.orderDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                        </div>
                      </td>
                        <td className="px-2 py-4">
                          <div className="text-xs font-medium">₹{item.productTotal.toLocaleString()}</div>
                          <div className="text-xs text-gray-500" title={`Base: ₹${item.priceAtPurchase.toLocaleString()} + GST: ₹${item.gstAmount.toLocaleString()}`}>
                            (incl. GST)
                          </div>
                      </td>
                        <td className="px-2 py-4">
                          <div className="text-xs">₹{item.commissionAmount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">({item.commissionPercentage}%)</div>
                      </td>
                        <td className="px-2 py-4">
                          <div className="text-xs font-semibold">₹{item.finalAmount.toLocaleString()}</div>
                      </td>
                        <td className="px-2 py-4">
                          <Badge 
                            variant={
                              item.invoiceStatus === "pending" ? "secondary" :
                              item.invoiceStatus === "sellerUploaded" ? "default" :
                              "default"
                            }
                            className="text-xs"
                          >
                            {item.invoiceStatus === "pending" ? "Pending" : 
                             item.invoiceStatus === "sellerUploaded" ? "Uploaded" : "Admin"}
                        </Badge>
                      </td>
                        <td className="px-2 py-4">
                          {item.labelUrl ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(item.labelUrl!, '_blank')}
                              className="p-1"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-2 py-4">
                          <div className="w-24">
                            <DocumentUpload
                              onUploadSuccess={(url) => handleFileUpload(item.id, 'sellerInvoice', url)}
                              existingFileUrl={item.sellerInvoice}
                              label="Invoice"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          <div className="w-24">
                            <DocumentUpload
                              onUploadSuccess={(url) => handleFileUpload(item.id, 'sellerEway', url)}
                              existingFileUrl={item.sellerEway}
                              label="E-way"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          {item.adminInvoice && item.adminInvoice.trim() !== "" ? (
                            <Button
                              onClick={() => window.open(item.adminInvoice!, '_blank')}
                              variant="ghost"
                              size="sm"
                              className="p-1"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-2 py-4">
                          {item.adminEway ? (
                            <Button
                              onClick={() => window.open(item.adminEway!, '_blank')}
                              variant="ghost"
                              size="sm"
                              className="p-1"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.length === 0 && !loading && (
              <div className="text-center py-12">
                  <div className="text-gray-500">No invoice data found</div>
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {data.map((item) => (
                <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  {/* Header with Product Info */}
                  <div className="flex gap-3 mb-3">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-md border flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-5 mb-1" title={item.productName}>
                        {item.productName}
                      </h3>
                      {item.variantTitle && (
                        <p className="text-xs text-gray-500 mb-1" title={item.variantTitle}>
                          {item.variantTitle}
                        </p>
                      )}
                      {item.productBrand && (
                        <p className="text-xs text-gray-400" title={item.productBrand}>
                          {item.productBrand}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge 
                        variant={
                          item.invoiceStatus === "pending" ? "secondary" :
                          item.invoiceStatus === "sellerUploaded" ? "default" :
                          "default"
                        }
                        className="text-xs"
                      >
                        {formatInvoiceStatus(item.invoiceStatus)}
                      </Badge>
                    </div>
                  </div>

                  {/* Customer and Date */}
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Customer</div>
                      <div className="font-medium" title={item.customerName}>
                        {truncateText(item.customerName, 20)}
                      </div>
                      {item.customerEmail && (
                        <div className="text-xs text-gray-500" title={item.customerEmail}>
                          {truncateText(item.customerEmail, 25)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Date</div>
                      <div className="font-medium">
                        {new Date(item.orderDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Product Total</div>
                      <div className="font-medium">₹{item.productTotal.toLocaleString()}</div>
                      <div className="text-xs text-gray-500" title={`Base: ₹${item.priceAtPurchase.toLocaleString()} + GST: ₹${item.gstAmount.toLocaleString()}`}>
                        (incl. GST)
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Commission</div>
                      <div className="font-medium">₹{item.commissionAmount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">({item.commissionPercentage}%)</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Final Amount</div>
                      <div className="font-semibold text-green-600">₹{item.finalAmount.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* AWB Information */}
                  {item.awb && (
                    <div className="mb-3 text-sm border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">AWB Number</div>
                          <div className="font-mono text-sm">{item.awb}</div>
                        </div>
                        {item.labelUrl ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(item.labelUrl!, '_blank')}
                            className="p-1"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Invoice Links */}
                  <div className="space-y-4 text-sm border-t pt-3">
                    {/* Seller Documents - Upload Area */}
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Seller Documents</div>
                      <div className="grid grid-cols-2 gap-3">
                        <DocumentUpload
                          onUploadSuccess={(url) => handleFileUpload(item.id, 'sellerInvoice', url)}
                          existingFileUrl={item.sellerInvoice}
                          label="Invoice"
                        />
                        <DocumentUpload
                          onUploadSuccess={(url) => handleFileUpload(item.id, 'sellerEway', url)}
                          existingFileUrl={item.sellerEway}
                          label="E-way"
                        />
                      </div>
                    </div>

                    {/* Admin Documents - Download Area */}
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Admin Documents</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs mb-1">Invoice:</div>
                          {item.adminInvoice && item.adminInvoice.trim() !== "" ? (
                            <Button
                              onClick={() => window.open(item.adminInvoice!, '_blank')}
                              variant="ghost"
                              size="sm"
                              className="p-1"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs mb-1">E-way:</div>
                          {item.adminEway ? (
                            <Button
                              onClick={() => window.open(item.adminEway!, '_blank')}
                              variant="ghost"
                              size="sm"
                              className="p-1"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ID at bottom */}
                  <div className="mt-3 pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      ID: <span className="font-mono" title={item.id}>{item.id}</span>
                    </div>
                  </div>
                </div>
              ))}

              {data.length === 0 && !loading && (
                <div className="text-center py-12 bg-white border rounded-lg">
                  <div className="text-gray-500">No invoice data found</div>
              </div>
            )}
            </div>

            {/* Custom Pagination */}
            {totalCount > 0 && (
              <div className="mt-4">
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}