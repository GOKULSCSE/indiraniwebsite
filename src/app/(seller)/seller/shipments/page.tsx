"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Tag,
  Receipt,
  MapPin,
  Calendar,
  Loader2,
  ExternalLink,
  Copy,
  Phone,
  Mail,
  ChevronDown,
  Upload,
  Download,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShipmentsSkeleton } from "@/components/ShipmentsSkeleton";
import { S3Storage } from "@/lib/s3";

interface ShipmentItem {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  priceAtPurchase: string;
  status: string;
  gstAmountAtPurchase: string;
  order: {
    id: string;
    userId: string;
    totalAmount: string;
    orderStatus: string;
    paymentStatus: string;
    paymentRefId: string;
    createdAt: string;
    updatedAt: string;
  };
  productVariant: {
    id: string;
    title: string;
    price: string;
    product: {
      name: string;
      productSKU: string;
    };
    ProductVariantImage: {
      id: string;
      imageUrl: string;
      isPrimary: boolean;
    }[];
  };
}

interface Shipment {
  id: string;
  pickupLocationId: number;
  shipmentId: number;
  orderId: number;
  courierServiceId: number;
  shippingCharge: number;
  shipmentStatus: string;
  ManifestUrl: string | null;
  InvoiceUrl: string | null;
  LabelUrl: string | null;
  AWB: string;
  createdAt: Date;
  updatedAt: Date;
  shipmentItems: ShipmentItem[];
  pickupLocation: {
    id: number;
    pickup_location: string;
    address: string;
    address_2: string;
    city: string;
    state: string;
    country: string;
    pin_code: string;
    email: string;
    phone: string;
    name: string;
  };
  sellerStatus: string;
  adminStatus: string;
  sellerInvoice?: string | null;
  sellerEway?: string | null;
  adminInvoice?: string | null;
  adminEway?: string | null;
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

const ShipmentsTable = () => {
  const [selectedShipments, setSelectedShipments] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [tableActiveTab, setTableActiveTab] = useState("NEW");
  const [dialogActiveTab, setDialogActiveTab] = useState("basic");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  
  // Status update dialog states
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState<{
    shipmentId: string;
    statusType: 'adminStatus' | 'sellerStatus';
    currentStatus: string;
    shipmentItems: any[];
  } | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('');
  
  const [tabCounts, setTabCounts] = useState({
    NEW: 0,
    SCHEDULED: 0,
    Shipped: 0,
    Delivered: 0,
    "Out for Delivery": 0,
    Cancelled: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: "NEW", label: "New", count: tabCounts.NEW },
    { id: "SCHEDULED", label: "Scheduled", count: tabCounts.SCHEDULED },
    { id: "Shipped", label: "Shipped", count: tabCounts.Shipped },
    
    { id: "Out for Delivery", label: "Out for Delivery", count: tabCounts["Out for Delivery"] },
    { id: "Delivered", label: "Delivered", count: tabCounts.Delivered },
    { id: "Cancelled", label: "Cancelled", count: tabCounts.Cancelled },
  ];

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    // Update tab counts whenever shipments change
    const newCounts = {
      NEW: 0,
      SCHEDULED: 0,
      Shipped: 0,
      Delivered: 0,
      "Out for Delivery": 0,
      Cancelled: 0,
    };

    shipments.forEach((shipment) => {
      const status = shipment.shipmentStatus;
      if (status in newCounts) {
        newCounts[status as keyof typeof newCounts]++;
      }
    });

    setTabCounts(newCounts);
  }, [shipments]);

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/seller/shipments");
      const data = await response.json();
      if (data.success) {
        setShipments(data.shipments);
      }
    } catch (error) {
      console.error("Error fetching shipments:", error);
      toast.error("Failed to fetch shipments");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter shipments based on active tab
  const filteredShipments = shipments.filter(
    (shipment) => shipment.shipmentStatus === tableActiveTab
  );

  const handleStatusClick = (shipment: Shipment, statusType: 'adminStatus' | 'sellerStatus', currentStatus: string) => {
    setStatusUpdateData({
      shipmentId: shipment.id,
      statusType,
      currentStatus,
      shipmentItems: shipment.shipmentItems,
    });
    setSelectedNewStatus(currentStatus);
    setIsStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateData || !selectedNewStatus) return;

    setIsUpdatingStatus(statusUpdateData.shipmentId);
    try {
      const response = await fetch(`/api/seller/shipments/${statusUpdateData.shipmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [statusUpdateData.statusType]: selectedNewStatus,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`${statusUpdateData.statusType === 'adminStatus' ? 'Admin' : 'Seller'} status updated successfully`);
        // Update the local state
        setShipments(prevShipments => 
          prevShipments.map(shipment => 
            shipment.id === statusUpdateData.shipmentId 
              ? { ...shipment, [statusUpdateData.statusType]: selectedNewStatus }
              : shipment
          )
        );
        setIsStatusDialogOpen(false);
        setStatusUpdateData(null);
        setSelectedNewStatus('');
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleFileUpload = async (shipmentId: string, field: 'sellerInvoice' | 'sellerEway', fileUrl: string) => {
    if (!fileUrl) {
      console.log("Empty file URL provided, skipping update");
      return;
    }
    
    try {
      const response = await fetch("/api/seller/shipments/documents", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipmentId,
          field,
          fileUrl,
        }),
      });

      const result = await response.json();

      // Show API response in console and toast
      console.log("API Response:", result);

      if (result.success) {
        // Update the local data to reflect changes immediately without a full reload
        setShipments(prevShipments => 
          prevShipments.map(shipment => {
            if (shipment.id === shipmentId) {
              const updatedShipment = { ...shipment, [field]: fileUrl };
              
              // Update seller status when API returns new status
              if (result.newSellerStatus) {
                updatedShipment.sellerStatus = result.newSellerStatus;
              }
              
              // Update admin status when API returns new status
              if (result.newAdminStatus) {
                updatedShipment.adminStatus = result.newAdminStatus;
              }
              
              return updatedShipment;
            }
            return shipment;
          })
        );

        // Update status dialog data if it's open and status was updated
        if (statusUpdateData && statusUpdateData.shipmentId === shipmentId) {
          if (result.newSellerStatus && statusUpdateData.statusType === 'sellerStatus') {
            setStatusUpdateData(prev => prev ? {
              ...prev,
              currentStatus: result.newSellerStatus
            } : null);
            setSelectedNewStatus(result.newSellerStatus);
          }
          if (result.newAdminStatus && statusUpdateData.statusType === 'adminStatus') {
            setStatusUpdateData(prev => prev ? {
              ...prev,
              currentStatus: result.newAdminStatus
            } : null);
            setSelectedNewStatus(result.newAdminStatus);
          }
        }
        
        // Show the message from the API (which includes status update info if applicable)
        toast.success(result.message);
        
        // Refresh shipments to get updated data from server
        fetchShipments();
      } else {
        toast.error(result.message || "Failed to save file reference");
        console.error("API Error:", result);
      }
    } catch (error) {
      console.error("Error saving file reference:", error);
      toast.error("Failed to save file reference. Please try again.");
    }
  };

  const getStatusOptions = (statusType: 'adminStatus' | 'sellerStatus') => {
    if (statusType === 'sellerStatus') {
      return [
        { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        { value: 'approved', label: 'Uploaded', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { value: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
      ];
    } else {
      return [
        { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        { value: 'approved', label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { value: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
      ];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "IN_TRANSIT":
        return <Truck className="w-4 h-4 text-blue-500" />;
      case "NEW":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "SCHEDULED":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "PICKED_UP":
        return <Package className="w-4 h-4 text-purple-500" />;
      case "CANCELLED":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN_TRANSIT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "NEW":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "SCHEDULED":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "PICKED_UP":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getAdminSellerStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getAdminSellerStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "pending":
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusDisplayText = (status: string, statusType: 'adminStatus' | 'sellerStatus') => {
    if (statusType === 'sellerStatus') {
      switch (status) {
        case 'approved':
          return 'uploaded';
        case 'pending':
          return 'pending';
        case 'rejected':
          return 'rejected';
        default:
          return status;
      }
    }
    if (statusType === 'adminStatus') {
      switch (status) {
        case 'approved':
          return 'uploaded';
        case 'pending':
          return 'pending';
        case 'rejected':
          return 'rejected';
        default:
          return status;
      }
    }
    return status;
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedShipments(new Set());
    } else {
      setSelectedShipments(new Set(filteredShipments.map((s) => s.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectShipment = (shipmentId: string) => {
    const newSelected = new Set(selectedShipments);
    if (newSelected.has(shipmentId)) {
      newSelected.delete(shipmentId);
    } else {
      newSelected.add(shipmentId);
    }
    setSelectedShipments(newSelected);
    setSelectAll(
      newSelected.size === filteredShipments.length &&
        filteredShipments.length > 0
    );
  };

  const handleViewShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDialogOpen(true);
  };

  const handleSchedulePickup = async (shipmentId: number) => {
    try {
      setIsScheduling(true);

      // Check if AWB exists
      if (!selectedShipment?.AWB) {
        toast.error("AWB not assigned. Please assign AWB first.");
        return;
      }

      const response = await fetch("/api/shiprocket/pickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipment_id: [shipmentId],
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Pickup scheduled successfully");
        setIsDialogOpen(false);
        // Refresh the shipments list
        fetchShipments();
      } else {
        // Handle specific error cases
        if (data.message?.toLowerCase().includes("awb not assigned")) {
          toast.error("AWB not assigned. Please assign AWB first.");
        } else if (data.message?.toLowerCase().includes("already scheduled")) {
          toast.error("Pickup is already scheduled for this shipment");
        } else {
          toast.error(data.message || "Failed to schedule pickup");
        }
      }
    } catch (error) {
      console.error("Error scheduling pickup:", error);
      toast.error("Failed to schedule pickup. Please try again later.");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleManifestClick = async (shipment: Shipment) => {
    try {
      // If manifest already exists, just open it
      if (shipment.ManifestUrl) {
        window.open(shipment.ManifestUrl, "_blank");
        return;
      }

      if (selectedShipment?.shipmentStatus == "NEW") {
        toast.error("Please schedule pickup before generating manifest");
        console.log("shipment");
        return;
      }

      setIsGeneratingManifest(true);

      // Step 1: Generate Manifest if it doesn't exist
      const manifestResponse = await fetch("/api/shiprocket/manifest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipment_id: [shipment.shipmentId],
          order_ids: [shipment.orderId],
        }),
      });

      const manifestData = await manifestResponse.json();

      if (!manifestData.success) {
        toast.error(manifestData.message || "Failed to generate manifest");
        return;
      }

      // // Step 2: Print Manifest
      // const printResponse = await fetch("/api/shiprocket/print", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     order_ids: [shipment.orderId],
      //   }),
      // })

      // const printData = await printResponse.json()

      // if (!printData.success) {
      //   toast.error(printData.message || "Failed to print manifest")
      //   return
      // }

      // Open the manifest URL
      if (manifestData.data?.manifest_url) {
        window.open(manifestData.data.manifest_url, "_blank");
      }

      // Open print manifest in new tab
      // if (printData.data?.url) {
      //   window.open(printData.data.url, "_blank")
      // }

      toast.success("Manifest generated successfully");

      // Refresh the shipments list to get updated URLs
      fetchShipments();
    } catch (error) {
      console.error("Error handling manifest:", error);
      toast.error("Failed to handle manifest");
    } finally {
      setIsGeneratingManifest(false);
    }
  };

  const handleLabelClick = async (shipment: Shipment) => {
    try {
      // If label already exists, just open it
      if (shipment.LabelUrl) {
        window.open(shipment.LabelUrl, "_blank");
        return;
      }

      setIsGeneratingLabel(true);

      const response = await fetch("/api/shiprocket/label", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipment_id: [shipment.shipmentId],
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to generate label");
        return;
      }

      if (data.data?.label_url) {
        window.open(data.data.label_url, "_blank");
      }

      toast.success("Label generated successfully");
      fetchShipments(); // Refresh to get updated URLs
    } catch (error) {
      console.error("Error handling label:", error);
      toast.error("Failed to handle label");
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handleInvoiceClick = async (shipment: Shipment) => {
    try {
      // If invoice already exists, just open it
      if (shipment.InvoiceUrl) {
        window.open(shipment.InvoiceUrl, "_blank");
        return;
      }

      setIsGeneratingInvoice(true);

      const response = await fetch("/api/shiprocket/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: [shipment.orderId],
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to generate invoice");
        return;
      }

      if (data.data?.invoice_url) {
        window.open(data.data.invoice_url, "_blank");
      }

      toast.success("Invoice generated successfully");
      fetchShipments(); // Refresh to get updated URLs
    } catch (error) {
      console.error("Error handling invoice:", error);
      toast.error("Failed to handle invoice");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const fetchTrackingDetails = async (awb: string) => {
    if (!awb) return;

    setIsLoadingTracking(true);
    try {
      const response = await fetch(`/api/shiprocket/tracking/${awb}`);
      const data = await response.json();

      if (data.success) {
        setTrackingData(data.data);
      } else {
        toast.error(data.message || "Failed to fetch tracking details");
      }
    } catch (error) {
      console.error("Error fetching tracking details:", error);
      toast.error("Failed to fetch tracking details");
    } finally {
      setIsLoadingTracking(false);
    }
  };

  // Fetch tracking details when dialog tab changes to tracking
  useEffect(() => {
    if (dialogActiveTab === "tracking" && selectedShipment?.AWB) {
      fetchTrackingDetails(selectedShipment.AWB);
    }
  }, [dialogActiveTab, selectedShipment?.AWB]);

  // Reset selections when tab changes
  React.useEffect(() => {
    setSelectedShipments(new Set());
    setSelectAll(false);
  }, [tableActiveTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen overflow-x-hidden">
      {isLoading ? (
        <ShipmentsSkeleton />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60">
            <div className="px-4 sm:px-6 py-5 border-b border-gray-200/60">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Shipments
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and track your shipments
                  </p>
                </div>
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
                <Package className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {filteredShipments.length} shipments
                </span>
              </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 overflow-x-auto bg-gray-50 p-1 rounded-lg scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTableActiveTab(tab.id)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                      tableActiveTab === tab.id
                        ? "bg-white text-blue-700 shadow-sm border border-blue-200/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    {tab.label}
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {tab.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Shipment ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Shipment Charge
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Courier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Seller status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Admin status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200/60">
                  {filteredShipments.length > 0 ? (
                    filteredShipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        className={`hover:bg-gray-50/50 transition-colors duration-150 ${
                          selectedShipments.has(shipment.id)
                            ? "bg-blue-50/50 border-l-4 border-l-blue-500"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedShipments.has(shipment.id)}
                            onChange={() => handleSelectShipment(shipment.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          #{shipment.shipmentId}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors">
                          #{shipment.orderId}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                          ₹{shipment.shippingCharge}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {shipment.pickupLocation?.pickup_location || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {shipment.courierServiceId || "Not Assigned"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={`${getStatusBadge(
                              shipment.shipmentStatus
                            )} border font-medium`}
                          >
                            {getStatusIcon(shipment.shipmentStatus)}
                            {shipment.shipmentStatus}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost"
                            className={`h-auto p-0 ${getAdminSellerStatusBadge(shipment.sellerStatus || 'pending')} border font-medium hover:opacity-80 transition-opacity`}
                            disabled={isUpdatingStatus === shipment.id}
                            onClick={() => handleStatusClick(shipment, 'sellerStatus', shipment.sellerStatus || 'pending')}
                          >
                            {isUpdatingStatus === shipment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              getAdminSellerStatusIcon(shipment.sellerStatus || 'pending')
                            )}
                            {getStatusDisplayText(shipment.sellerStatus || 'pending', 'sellerStatus')}
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost"
                            className={`h-auto p-0 ${getAdminSellerStatusBadge(shipment.adminStatus || 'pending')} border font-medium hover:opacity-80 transition-opacity`}
                            disabled={isUpdatingStatus === shipment.id}
                            onClick={() => handleStatusClick(shipment, 'adminStatus', shipment.adminStatus || 'pending')}
                          >
                            {isUpdatingStatus === shipment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              getAdminSellerStatusIcon(shipment.adminStatus || 'pending')
                            )}
                            {getStatusDisplayText(shipment.adminStatus || 'pending', 'adminStatus')}
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => handleViewShipment(shipment)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No shipments found
                          </h3>
                          <p className="text-sm text-gray-500">
                            There are no shipments in the{" "}
                            {tabs
                              .find((tab) => tab.id === tableActiveTab)
                              ?.label.toLowerCase()}{" "}
                            status.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedShipments.size > 0 && (
              <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">
                    {selectedShipments.size} shipment
                    {selectedShipments.size !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Bulk Action
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedShipments(new Set());
                        setSelectAll(false);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modern Shipment Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden">
              {selectedShipment && (
                <>
                  {/* Modern Header with Gradient */}
                  <div className="relative bg-gradient-to-r from-red-700 via-red-700 to-red-600 text-white p-6">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <DialogTitle className="text-2xl font-bold mb-2">
                            Shipment #{selectedShipment.shipmentId}
                          </DialogTitle>
                          <div className="flex items-center gap-4 text-blue-100">
                            <span className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              Order #{selectedShipment.orderId}
                            </span>
                            <span className="flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              {selectedShipment.AWB || "AWB Pending"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${getStatusBadge(
                              selectedShipment.shipmentStatus
                            )} border-0 text-sm px-3 py-1`}
                          >
                            {getStatusIcon(selectedShipment.shipmentStatus)}
                            {selectedShipment.shipmentStatus}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                          onClick={() =>
                            selectedShipment &&
                            handleManifestClick(selectedShipment)
                          }
                          disabled={
                            !selectedShipment?.shipmentId ||
                            isGeneratingManifest ||
                            selectedShipment?.shipmentStatus == "NEW"
                          }
                        >
                          {isGeneratingManifest ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <FileText className="w-4 h-4 mr-2" />
                          )}
                          {selectedShipment?.ManifestUrl
                            ? "View Manifest"
                            : "Generate Manifest"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                          onClick={() =>
                            selectedShipment && handleLabelClick(selectedShipment)
                          }
                          disabled={
                            !selectedShipment?.shipmentId || isGeneratingLabel
                          }
                        >
                          {isGeneratingLabel ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Tag className="w-4 h-4 mr-2" />
                          )}
                          {selectedShipment?.LabelUrl
                            ? "View Label"
                            : "Generate Label"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                          onClick={() =>
                            selectedShipment && handleInvoiceClick(selectedShipment)
                          }
                          disabled={
                            !selectedShipment?.shipmentId || isGeneratingInvoice
                          }
                        >
                          {isGeneratingInvoice ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Receipt className="w-4 h-4 mr-2" />
                          )}
                          {selectedShipment?.InvoiceUrl
                            ? "View Invoice"
                            : "Generate Invoice"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Modern Tab Navigation */}
                  <div className="border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
                    <nav className="flex px-6">
                      <button
                        className={`py-4 px-6 border-b-2 font-semibold text-sm transition-all duration-200 ${
                          dialogActiveTab === "basic"
                            ? "border-blue-500 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                        onClick={() => setDialogActiveTab("basic")}
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Shipment Details
                        </div>
                      </button>
                      <button
                        className={`py-4 px-6 border-b-2 font-semibold text-sm transition-all duration-200 ${
                          dialogActiveTab === "tracking"
                            ? "border-blue-500 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                        onClick={() => setDialogActiveTab("tracking")}
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Live Tracking
                        </div>
                      </button>
                    </nav>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {dialogActiveTab === "basic" ? (
                      <>
                        {/* Quick Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                  <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                    Shipment ID
                                  </p>
                                  <p className="text-lg font-bold text-blue-900">
                                    #{selectedShipment.shipmentId}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                  <Receipt className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                                    Shipping Cost
                                  </p>
                                  <p className="text-lg font-bold text-emerald-900">
                                    ₹{selectedShipment.shippingCharge}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                  <Truck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                    Courier
                                  </p>
                                  <p className="text-lg font-bold text-purple-900">
                                    {selectedShipment.courierServiceId || "Pending"}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                                  <Tag className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                                    AWB Number
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-amber-900">
                                      {selectedShipment.AWB || "Not Assigned"}
                                    </p>
                                    {selectedShipment.AWB && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-amber-200"
                                        onClick={() =>
                                          copyToClipboard(selectedShipment.AWB)
                                        }
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Pickup Location Card */}
                        <Card className="border-0 shadow-sm">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              Pickup Location
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Location Name
                                  </label>
                                  <p className="text-sm font-medium text-gray-900 mt-1">
                                    {
                                      selectedShipment.pickupLocation
                                        ?.pickup_location
                                    }
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Contact Person
                                  </label>
                                  <p className="text-sm font-medium text-gray-900 mt-1">
                                    {selectedShipment.pickupLocation?.name}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Address
                                  </label>
                                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                    {selectedShipment.pickupLocation?.address}
                                    {selectedShipment.pickupLocation?.address_2 &&
                                      `, ${selectedShipment.pickupLocation.address_2}`}
                                    <br />
                                    {selectedShipment.pickupLocation?.city},{" "}
                                    {selectedShipment.pickupLocation?.state} -{" "}
                                    {selectedShipment.pickupLocation?.pin_code}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Contact Information
                                  </label>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-700">
                                        {selectedShipment.pickupLocation?.phone}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-700">
                                        {selectedShipment.pickupLocation?.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Order Items Card */}
                        <Card className="border-0 shadow-sm">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Package className="w-5 h-5 text-blue-600" />
                              Order Items
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedShipment.shipmentItems.length > 0 ? (
                              <div className="space-y-4">
                                {selectedShipment.shipmentItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100"
                                  >
                                    {/* Product Image */}
                                    <div className="w-16 h-16 flex-shrink-0">
                                      <img
                                        src={
                                          item.productVariant.ProductVariantImage.find(
                                            (img) => img.isPrimary
                                          )?.imageUrl ||
                                          item.productVariant.ProductVariantImage[0]
                                            ?.imageUrl ||
                                          "/placeholder.svg?height=64&width=64"
                                        }
                                        alt={item.productVariant.product.name}
                                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                                      />
                                    </div>
                                    {/* Product Details */}
                                    <div className="flex-grow">
                                      <h4 className="font-semibold text-gray-900 mb-1">
                                        {item.productVariant.product.name}
                                      </h4>
                                      <p className="text-sm text-gray-500 mb-2">
                                        SKU:{" "}
                                        {item.productVariant.product.productSKU}
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <span className="text-gray-500">
                                            Quantity:
                                          </span>
                                          <span className="font-medium text-gray-900 ml-1">
                                            {item.quantity}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">
                                            Price:
                                          </span>
                                          <span className="font-medium text-emerald-600 ml-1">
                                            ₹{item.priceAtPurchase}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">
                                            GST:
                                          </span>
                                          <span className="font-medium text-gray-900 ml-1">
                                            ₹{item.gstAmountAtPurchase}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">
                                            Status:
                                          </span>
                                          <Badge
                                            variant="secondary"
                                            className="ml-1 text-xs"
                                          >
                                            {item.status}
                                          </Badge>
                                        </div>
                                      </div>
                                      {item.order && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                            <div>
                                              <span className="text-gray-500">
                                                Order Status:
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="ml-2 text-xs"
                                              >
                                                {item.order.orderStatus}
                                              </Badge>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">
                                                Payment:
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="ml-2 text-xs"
                                              >
                                                {item.order.paymentStatus}
                                              </Badge>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">
                                                Total:
                                              </span>
                                              <span className="font-semibold text-emerald-600 ml-1">
                                                ₹{item.order.totalAmount}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                  No items found
                                </h3>
                                <p className="text-sm text-gray-500">
                                  This shipment doesn't contain any items.
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      /* Tracking Tab */
                      <div className="space-y-6">
                        {!selectedShipment?.AWB ? (
                          <Card className="border-0 shadow-sm">
                            <CardContent className="text-center py-12">
                              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-amber-500" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                AWB Not Assigned
                              </h3>
                              <p className="text-sm text-gray-500">
                                Tracking information will be available once the AWB
                                number is assigned.
                              </p>
                            </CardContent>
                          </Card>
                        ) : isLoadingTracking ? (
                          <Card className="border-0 shadow-sm">
                            <CardContent className="text-center py-12">
                              <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Loading Tracking Details
                              </h3>
                              <p className="text-sm text-gray-500">
                                Please wait while we fetch the latest tracking
                                information...
                              </p>
                            </CardContent>
                          </Card>
                        ) : !trackingData ? (
                          <Card className="border-0 shadow-sm">
                            <CardContent className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Truck className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No Tracking Data
                              </h3>
                              <p className="text-sm text-gray-500">
                                Tracking information is not available for this
                                shipment yet.
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            {/* Current Status Card */}
                            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <Truck className="w-5 h-5 text-blue-600" />
                                  Current Status
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div
                                        className={`w-3 h-3 rounded-full ${
                                          trackingData.tracking_data
                                            .shipment_track[0].current_status ===
                                          "Delivered"
                                            ? "bg-emerald-500"
                                            : trackingData.tracking_data
                                                .shipment_track[0]
                                                .current_status === "In Transit"
                                            ? "bg-blue-500"
                                            : trackingData.tracking_data
                                                .shipment_track[0]
                                                .current_status === "Canceled"
                                            ? "bg-red-500"
                                            : "bg-amber-500"
                                        }`}
                                      />
                                      <p className="text-lg font-bold text-gray-900">
                                        {
                                          trackingData.tracking_data
                                            .shipment_track[0].current_status
                                        }
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                      Current Status
                                    </p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      {
                                        trackingData.tracking_data.shipment_track[0]
                                          .origin
                                      }
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                      Origin
                                    </p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      {
                                        trackingData.tracking_data.shipment_track[0]
                                          .destination
                                      }
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                      Destination
                                    </p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      {
                                        trackingData.tracking_data.shipment_track[0]
                                          .courier_name
                                      }
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                      Courier Partner
                                    </p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      {new Date(
                                        trackingData.tracking_data.etd
                                      ).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                      Expected Delivery
                                    </p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      {new Date(
                                        trackingData.tracking_data.shipment_track[0].updated_time_stamp
                                      ).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                      Last Updated
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Tracking Timeline */}
                            <Card className="border-0 shadow-sm">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <Clock className="w-5 h-5 text-blue-600" />
                                  Tracking Timeline
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="relative">
                                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-gray-200" />
                                  <div className="space-y-6">
                                    {(
                                      trackingData.tracking_data
                                        .shipment_track_activities ?? []
                                    ).map((activity: any, index: number) => (
                                      <div key={index} className="relative pl-10">
                                        <div
                                          className={`absolute left-3 top-1.5 w-3 h-3 rounded-full border-2 ${
                                            activity["sr-status-label"] ===
                                            "PICKUP EXCEPTION"
                                              ? "border-red-500"
                                              : activity["sr-status-label"] ===
                                                "DELIVERED"
                                              ? "border-green-500"
                                              : "border-blue-500"
                                          } bg-white`}
                                        />
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span
                                              className={`px-2 py-0.5 text-xs rounded-full ${
                                                activity["sr-status-label"] ===
                                                "PICKUP EXCEPTION"
                                                  ? "bg-red-100 text-red-800"
                                                  : activity["sr-status-label"] ===
                                                    "DELIVERED"
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-blue-100 text-blue-800"
                                              }`}
                                            >
                                              {activity["sr-status-label"]}
                                            </span>
                                          </div>
                                          <p className="font-medium">
                                            {activity.activity}
                                          </p>
                                          <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                                            <p>
                                              {new Date(
                                                activity.date
                                              ).toLocaleString()}
                                            </p>
                                            <p>{activity.location}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* External Tracking Link */}
                                <div className="flex justify-center mt-8">
                                  <Button
                                    asChild
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                                  >
                                    <a
                                      href={trackingData.tracking_data.track_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Track on Shiprocket
                                    </a>
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Modern Footer */}
                  <div className="flex justify-between items-center p-6 border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
                    <div className="text-sm text-gray-500">
                      Last updated:{" "}
                      {new Date(selectedShipment.updatedAt).toLocaleString()}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isScheduling}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        Close
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50"
                        onClick={() =>
                          selectedShipment &&
                          handleSchedulePickup(selectedShipment.shipmentId)
                        }
                        disabled={
                          isScheduling ||
                          selectedShipment?.shipmentStatus !== "NEW" ||
                          !selectedShipment?.AWB
                        }
                      >
                        {isScheduling ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Scheduling...
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Pickup
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Status Update Dialog */}
          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Update {statusUpdateData?.statusType === 'adminStatus' ? 'Admin' : 'Seller'} Status
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Current status: <span className="font-medium">{getStatusDisplayText(statusUpdateData?.currentStatus || 'pending', statusUpdateData?.statusType || 'sellerStatus')}</span>
                  </p>
                  
                  {/* Show automatic status message for seller and admin status */}
                  {(statusUpdateData?.statusType === 'sellerStatus' || statusUpdateData?.statusType === 'adminStatus') ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Automatic Status Management</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        {statusUpdateData?.statusType === 'sellerStatus'
                          ? 'Seller status automatically changes to "uploaded" when invoice is uploaded. E-way bill is optional and does not affect status. Upload your invoice below to update the status.'
                          : 'Admin status automatically changes to "approved" when admin invoice is uploaded. Upload your documents below to update the status.'}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Document Management Section */}
                {statusUpdateData?.shipmentItems && statusUpdateData.shipmentItems.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Document Management</h3>
                    
                    {/* Shipment-level Documents */}
                    <Card className="border-0 shadow-sm bg-gray-50 mb-4">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-4">Shipment Documents</h4>
                        <div className="grid grid-cols-1 gap-6">
                          {/* Seller Documents - Only show for seller status */}
                          {statusUpdateData.statusType === 'sellerStatus' && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 mb-3">Seller Documents</h5>
                              <div className="space-y-3">
                                <DocumentUpload
                                  onUploadSuccess={(url) => handleFileUpload(statusUpdateData.shipmentId, 'sellerInvoice', url)}
                                  existingFileUrl={shipments.find(s => s.id === statusUpdateData.shipmentId)?.sellerInvoice}
                                  label="Invoice"
                                />
                                <DocumentUpload
                                  onUploadSuccess={(url) => handleFileUpload(statusUpdateData.shipmentId, 'sellerEway', url)}
                                  existingFileUrl={shipments.find(s => s.id === statusUpdateData.shipmentId)?.sellerEway}
                                  label="E-way Bill"
                                />
                              </div>
                            </div>
                          )}

                          {/* Admin Documents - Only show for admin status */}
                          {statusUpdateData.statusType === 'adminStatus' && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 mb-3">Admin Documents</h5>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs font-medium">Invoice</Label>
                                  <div className="mt-1">
                                    {shipments.find(s => s.id === statusUpdateData.shipmentId)?.adminInvoice ? (
                                      <Button
                                        onClick={() => window.open(shipments.find(s => s.id === statusUpdateData.shipmentId)?.adminInvoice!, '_blank')}
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Invoice
                                      </Button>
                                    ) : (
                                      <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded border">
                                        No admin invoice available
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium">E-way Bill</Label>
                                  <div className="mt-1">
                                    {shipments.find(s => s.id === statusUpdateData.shipmentId)?.adminEway ? (
                                      <Button
                                        onClick={() => window.open(shipments.find(s => s.id === statusUpdateData.shipmentId)?.adminEway!, '_blank')}
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download E-way
                                      </Button>
                                    ) : (
                                      <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded border">
                                        No admin e-way available
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order Items List */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Order Items in this Shipment</h4>
                      {statusUpdateData.shipmentItems.map((item) => (
                        <Card key={item.id} className="border-0 shadow-sm bg-white">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              {/* Product Image */}
                              <div className="w-16 h-16 flex-shrink-0">
                                <img
                                  src={
                                    item.productVariant?.ProductVariantImage?.find(
                                      (img: any) => img.isPrimary
                                    )?.imageUrl ||
                                    item.productVariant?.ProductVariantImage?.[0]?.imageUrl ||
                                    "/placeholder.svg?height=64&width=64"
                                  }
                                  alt={item.productVariant?.product?.name || 'Product'}
                                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                                />
                              </div>
                              {/* Product Details */}
                              <div className="flex-grow">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {item.productVariant?.product?.name || 'Unknown Product'}
                                </h4>
                                <p className="text-sm text-gray-500 mb-2">
                                  SKU: {item.productVariant?.product?.productSKU || 'N/A'}
                                </p>
                                <div className="text-sm text-gray-600">
                                  Quantity: {item.quantity} | Price: ₹{item.priceAtPurchase}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsStatusDialogOpen(false);
                      setStatusUpdateData(null);
                      setSelectedNewStatus('');
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ShipmentsTable;
