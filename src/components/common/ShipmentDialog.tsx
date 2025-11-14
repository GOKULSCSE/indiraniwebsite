import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
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
} from "lucide-react";

// Types for shipment and shipment item (copy from shipments/page.tsx)
export interface ShipmentItem {
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

export interface Shipment {
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
}

interface ShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment | null;
  dialogActiveTab?: string;
  setDialogActiveTab?: (tab: string) => void;
  isGeneratingManifest?: boolean;
  isGeneratingLabel?: boolean;
  isGeneratingInvoice?: boolean;
  isScheduling?: boolean;
  onManifestClick?: (shipment: Shipment) => void;
  onLabelClick?: (shipment: Shipment) => void;
  onInvoiceClick?: (shipment: Shipment) => void;
  onSchedulePickup?: (shipmentId: number) => void;
  trackingData?: any;
  isLoadingTracking?: boolean;
  fetchTrackingDetails?: (awb: string) => void;
}

const ShipmentDialog: React.FC<ShipmentDialogProps> = ({
  open,
  onOpenChange,
  shipment,
  dialogActiveTab = "basic",
  setDialogActiveTab,
  isGeneratingManifest = false,
  isGeneratingLabel = false,
  isGeneratingInvoice = false,
  isScheduling = false,
  onManifestClick,
  onLabelClick,
  onInvoiceClick,
  onSchedulePickup,
  trackingData,
  isLoadingTracking = false,
  fetchTrackingDetails,
}) => {
  // ... (copy the dialog JSX and logic from shipments/page.tsx, using props)
  // For brevity, only the interface and structure are shown here.
  // You will need to copy the dialog JSX and handlers from the shipments page.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-7xl h-[90vh] p-0 overflow-hidden ">
        {/* ...dialog content from shipments/page.tsx, using shipment prop... */}
        {/* You can pass down handlers and state as props for full control */}
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentDialog; 