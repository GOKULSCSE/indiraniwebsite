"use client";
import Link from "next/link";
import { Download, Filter, Search, ChevronDown, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { FileText, CheckCircle, Clock, AlertOctagon } from "lucide-react";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import CustomAlert from "@/components/CustomAlert";
import SellerOrderLoader from "@/components/SellerOrderLoader";
import axios from "axios";

// Define types for your API response
type Payment = {
  id: string;
  orderId: string;
  formattedOrderId: string; // Add this new field
  sellerId: string;
  quantity: number;
  priceAtPurchase: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  productVariantId: string;
  status: string;
  isRefunded?: boolean;
  refundedAmount?: string | number;
  productVariant: {
    id: string;
    productVariantSKU: string;
    productId: string;
    title: string;
    description: string;
    price: string;
    stockQuantity: number;
    variantType: string;
    variantValue: string;
    additionalPrice: string;
    createdAt: string;
    updatedAt: string;
    product: {
      id: string;
      productSKU: string;
      sellerId: string;
      categoryId: string;
      name: string;
      description: string;
      isApproved: boolean;
      createdAt: string;
      updatedAt: string;
      aboutProduct: Record<string, any>;
      images: Array<{
        id: string;
        productId: string;
        imageUrl: string;
        isPrimary: boolean;
        createdAt: string;
      }>;
    };
  };
  User: {
    id: string;
    email: string;
    profile: string;
    firstName: string | null;
    lastName: string | null;
    name: string;
    roleId: string;
    isEmailVerified: boolean;
    emailVerifiedAt: string;
    createdAt: string;
    updatedAt: string;
  };
  seller: {
    id: string;
    userId: string;
    storeName: string;
    storeDescription: string;
    bankAccountId: string;
    upiId: string;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string;
    address: string;
    alternateMobileNumber: string | null;
    city: string;
    country: string;
    latitude: string | null;
    longitude: string | null;
    mobileNumber: string;
    pincode: string;
    state: string;
    preferedPickupID: string | null;
    gstNumber: string;
  };
  OrderItemPayment: Array<{
    id: string;
    orderItemId: string;
    paymentId: string;
    amount: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    paymentType: string;
    reason: string | null;
  }>;
};

type ApiResponse = {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: {
    count: {
      total: number;
      paid: number;
      refunded: number;
      overallPaidAmount: number;
      overallRefundedAmount: number;
    };
    payments: Payment[];
  };
};

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("Paid");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Map from UI tab name to API status
  const statusMap: Record<string, string> = {
    "Total": "",
    "Paid": "paid",
    "Refunded": "refunded"
  };

  // Fetch payments data
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        // Add status parameter based on active tab
        params.append("status", statusMap[activeTab]);

        // Add pagination parameters
        params.append("limit", rowsPerPage.toString());
        params.append("offset", ((currentPage - 1) * rowsPerPage).toString());

        // Add search parameter if provided
        if (searchQuery) {
          params.append("search", searchQuery);
        }

        // Add sorting parameters
        if (sortBy) {
          params.append("sortBy", sortBy);
          params.append("sortOrder", sortOrder);
        }

        // Add date range parameters if provided
        if (startDate) {
          params.append("startDate", startDate);
        }

        if (endDate) {
          params.append("endDate", endDate);
        }

        const response = await axios.get<ApiResponse>(`/api/seller/payments?${params.toString()}`);
        setData(response.data);

        // Update total count for pagination
        if (response.data?.data?.count) {
          const statusFilterCount = activeTab === "Total"
            ? response.data.data.count.total
            : response.data.data.count[statusMap[activeTab] as keyof typeof response.data.data.count];
          setTotalCount(statusFilterCount);
        }
      } catch (err) {
        // Handle error appropriately
        console.error("Error fetching payments:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [activeTab, currentPage, rowsPerPage, searchQuery, sortBy, sortOrder, startDate, endDate]);

  // Map API status to UI status
  const mapApiStatusToUI = (apiStatus: string) => {
    switch (apiStatus) {
      case "completed":
        return "Paid";
      case "pending":
        return "Pending";
      case "failed":
        return "Overdue";
      case "refunded":
        return "Refunded";
      default:
        return "Pending";
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    return `₹${parseInt(amount).toLocaleString("en-IN")}`;
  };

  // Tab configuration
  const tabs = [
    {
      name: "Paid",
      count: data?.data.count.paid || 0,
      amount: data?.data.count.overallPaidAmount || 0,
      color: "text-green-500",
      image: "/assets/icons/Vector.png",
      displayname: "Paid"
    },
    {
      name: "Refunded",
      count: data?.data.count.refunded || 0,
      amount: data?.data.count.overallRefundedAmount || 0,
      color: "text-red-500",
      image: "/assets/icons/point-of-sale-bill 1.png",
      displayname: "Refunded"
    },
  ];

  const badgeStyles: Record<string, string> = {
    Total: "bg-blue-50 text-blue-700",
    Paid: "bg-green-100 text-green-700",
    Refunded: "bg-red-100 text-red-700",
  };

  const badgeColors: Record<string, string> = {
    Total: "#80DCEC",
    Paid: "#118D57",
    Refunded: "#FF5630",
  };

  // Get payments from data
  const payments = data?.data.payments || [];

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const allSelected = selectedPayments.length === payments.length && payments.length > 0;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map(payment => payment.id));
    }
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedPayments(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(paymentId => paymentId !== id)
        : [...prevSelected, id]
    );
  };

  const maxCount = Math.max(...tabs.map((tab) => tab.count));
  const totalAmount = tabs.reduce((sum, tab) => sum + (tab.amount || 0), 0);

  // if (isLoading) {
  //   return <SellerOrderLoader />;
  // }

  if (error) {
    return <div>Error loading payments</div>;
  }

  return (
    <span className="relative">


      {/* <nav className="text-sm text-gray-600" aria-label="breadcrumb">
        <ol className="flex space-x-2 mb-4">
          <li>
            <Link href="/" className="text-blue-600 hover:underline">
              Home
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-800 font-medium">Payments</li>
        </ol>
      </nav> */}

      <div className="flex justify-between items-center text-2xl font-bold mb-4">
        {/* <span>Payments</span>
        <button className="px-4 py-2 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition">
          + New Invoice
        </button> */}
      </div>

      {/* Stats Cards */}
      {/* Stats Cards - Responsive Version */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {tabs.filter(tab => tab.name !== "Total").map((tab, index) => {
          const progress = maxCount > 0 ? (tab.count / maxCount) * 100 : 0;
          const strokeColor = badgeColors[tab.name] || "#000";
          return (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
              <div className="relative w-16 h-16">
                <CircularProgressbar
                  value={progress}
                  maxValue={100}
                  strokeWidth={3}
                  styles={buildStyles({
                    pathColor: strokeColor,
                    trailColor: "#E5E7EB",
                    strokeLinecap: "round",
                  })}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src={tab.image} alt={tab.name} className="w-8 h-8 object-contain" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-gray-900 font-medium text-sm truncate">{tab.displayname}</h4>
                <p className="text-xs text-gray-500">
                  {isLoading ? (
                    <span className="inline-block h-4 w-10 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${tab.count} payments`
                  )}
                </p>
                <p className="text-lg font-bold truncate">
                  {tab.displayname === "Total"
                    ? formatCurrency(totalAmount.toString())
                    : formatCurrency((tab.amount ?? 0).toString())}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <br />
      <br />

      {/* Tabs Section */}
      {/* Tabs Section - Responsive Version */}
<div className="bg-white p-4 rounded-lg shadow-sm mb-6 overflow-x-auto">
  <div className="flex space-x-4 w-max min-w-full">
    {tabs.map((tab) => (
      <button
        key={tab.name}
        onClick={() => {
          setActiveTab(tab.name);
          setCurrentPage(1);
        }}
        className={`relative px-4 py-2 font-medium text-base whitespace-nowrap transition-all
          ${activeTab === tab.name ? "text-blue-600" : "text-gray-600"}`}
      >
        {tab.name}
        <span className={`ml-2 px-2 py-0.5 text-sm font-bold rounded ${badgeStyles[tab.name]}`}>
          {isLoading ? (
            <span className="inline-block h-4 w-6 bg-gray-200 rounded animate-pulse" />
          ) : (
            tab.count
          )}
        </span>
        {activeTab === tab.name && (
          <span className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-600"></span>
        )}
      </button>
    ))}
  </div>
</div>

      {/* Filter/Search/Sort Section */}
      {/* Filter/Search/Sort Section - Responsive Version */}
<div className="bg-white p-4 rounded-lg shadow-sm mb-6">
  <div className="flex flex-col sm:flex-row gap-3">
    {/* <button className="flex items-center justify-center sm:justify-start text-gray-700 px-4 py-2 rounded-md border sm:w-auto w-full">
      <Filter className="mr-2 w-5 h-5" /> Filter
    </button> */}

    <div className="flex flex-col sm:flex-row gap-3 flex-1">
      <div className="flex items-center border px-4 py-2 rounded-md flex-1">
        <Search className="text-gray-500 mr-2 w-5 h-5" />
        <input
          type="text"
          placeholder="Search payments"
          className="outline-none w-full"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="flex items-center border px-4 py-2 rounded-md w-full sm:w-auto">
        <select 
          className="outline-none w-full"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="createdAt">Date</option>
          <option value="amount">Amount</option>
        </select>
        <button 
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="ml-2"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* <button className="flex items-center justify-center text-gray-700 font-medium border px-4 py-2 rounded-md w-full sm:w-auto">
        <span className="hidden sm:inline">Download Invoice</span>
        <Download className="sm:ml-2 w-5 h-5" />
      </button> */}
    </div>
  </div>
</div>

      {/* Payments Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
         <div className="min-w-[800px]"> 
        <table className="w-full border-collapse table-fixed">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-4 px-4 text-left w-[50px]">
                <input
                  type="checkbox"
                  className="form-checkbox h-6 w-6 text-blue-600 border-2 border-gray-600 rounded-md"
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="py-4 px-4 text-left w-[200px] text-base">Order</th>
              <th className="py-4 px-4 text-left w-[200px] text-base">Customer</th>
              <th className="py-4 px-4 text-left w-[200px] text-base">Seller</th>
              <th className="py-4 px-4 text-left w-[200px] text-base">Product</th>
              <th className="py-4 px-4 text-left w-[150px] text-base">Date</th>
              <th className="py-4 px-4 text-left w-[120px] text-base">Amount</th>
              <th className="py-4 px-4 text-left w-[120px] text-base">Status</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {isLoading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b animate-pulse">
                    {Array.from({ length: 8 }).map((_, cidx) => (
                      <td key={cidx} className="py-4 px-4">
                        <div className="h-5 bg-gray-200 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : payments.length > 0 ? (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          className="form-checkbox h-6 w-6 text-blue-600 border-2 border-gray-600 rounded-md"
                          checked={selectedPayments.includes(payment.id)}
                          onChange={() => handleCheckboxChange(payment.id)}
                        />
                      </td>
                      <td className="py-4 px-4 font-bold">
                        {payment.formattedOrderId}
                      </td>
                      <td className="py-4 px-4">
                        <div className="truncate max-w-[180px]">{payment.User?.name || `Customer ${payment.userId.slice(0, 8)}`}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[180px]">
                          {payment.User?.email}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="truncate max-w-[180px]">{payment.seller?.storeName}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[180px]">
                          {payment.seller?.storeDescription}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="truncate max-w-[180px]">{payment.productVariant?.product?.name}</div>
                        <div className="text-sm text-gray-500">
                          Qty: {payment.quantity}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="truncate max-w-[130px]">{formatDate(payment.createdAt)}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[130px]">
                          {formatTime(payment.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-4 truncate max-w-[100px]">{formatCurrency(payment.priceAtPurchase)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-4 py-2 text-sm font-bold rounded ${payment.isRefunded ? badgeStyles["Refunded"] : badgeStyles["Paid"]}`}>
                          {payment.isRefunded ? "Refunded" : "Paid"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {payments.length > 0 && (
          <div className="flex items-center justify-end space-x-6 mt-4 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-gray-700 text-lg">Rows Per Page:</h1>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-md p-1 text-gray-700 font-bold text-lg"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="text-gray-700 font-bold text-lg">
              {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"}`}
              >
                <ChevronLeft />
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"}`}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </span>
  );
};

export default PaymentsPage;