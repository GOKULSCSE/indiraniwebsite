"use client";
import { useState, type ChangeEvent, useEffect, Suspense } from "react";
import type React from "react";

import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";
import _ from "lodash";
import ShippingPageLoader from "@/components/ShippingPageLoader";
import dynamic from "next/dynamic";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BadgePercent } from "lucide-react";
import { toast } from "sonner";
import PaymentLoadingScreen from "@/components/Lottie/PaymentLoadingScreen";
import { usePaymentStore } from "@/store/paymentStore";
import OrderConfirmationOverlay from "@/components/OrderConfirmationOverlay";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PaymentButton = dynamic(
  () => import("@/components/common/Payment/PaymentButton"),
  { ssr: false }
);

const RazorpayAffordabilityWidget = dynamic(
  () => import("@/components/common/Payment/RazorpayAffordabilityWidget"),
  { ssr: false }
);

interface SubmittedReview {
  rating: number;
  text: string;
  createdAt: string;
}

// Define the base discount interface
interface Discount {
  id: string;
  discountType: "percentage" | "amount";
  discountValue: number;
  startDate: string;
  endDate: string;
}

// Use the same interface for selected discounts
interface SelectedDiscounts {
  [key: string]: Discount;
}

type CheckoutItem = {
  id: string;
  product: any;
  productVariant: {
    id: string;
    price: number | string;
    title?: string;
    description?: string;
    variantType?: string;
    variantValue?: string;
    stockQuantity?: number;
    productWeight?: string;
    product?: any;
    ProductVariantImage?: {
      id: string;
      imageUrl: string;
      isPrimary: boolean;
    }[];
    discounts?: {
      id: string;
      discountType: string;
      discountValue: number;
      startDate: string;
      endDate: string;
    }[];
  };
  quantity: number;
  rating?: number;
  reviews?: SubmittedReview[] | number;
  cartItemId?: string;
};

// Update the CourierService interface to match new response
interface CourierService {
  courier_company_id: number;
  courier_name: string;
  estimated_delivery_days: string;
  rate: number;
  freight_charge: number;
  cod: number;
  etd: string;
  rating?: number;
  delivery_performance?: number;
  pickup_performance?: number;
  tracking_performance?: number;
  is_surface?: boolean;
  is_rto_address_available?: boolean;
  pod_available?: string;
  realtime_tracking?: string;
}

interface ShiprocketLocation {
  id: number;
  pickup_location: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  phone: string;
  name: string;
}

interface InputFieldProps {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  placeholder,
  type = "text",
  value,
  onChange,
}) => (
  <div className="relative w-full">
    <label className="absolute bg-white px-2 -top-3 left-3 text-gray-600 text-sm">
      {label} <span className="text-red-600">*</span>
    </label>
    <input
      type={type}
      name={name}
      className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
    />
  </div>
);

interface FormData {
  id?: string;
  userId?: string;
  fullName: string;
  phone: string;
  doorNo: string;
  street: string;
  state: string;
  email: string;
  zipCode: string;
  landmark: string;
  city: string;
  country: string;
  companyName?: string;
  gstid?: string;
}

// Update the shipping details interface
interface ShippingDetails {
  cartItemId: string;
  courierService: CourierService;
  item: CheckoutItem;
}

// Add new interfaces for shipping calculations
interface SellerShippingDetails {
  sellerId: string;
  storeName: string;
  courierService: CourierService;
  items: CheckoutItem[];
}

interface ShippingCalculation {
  sellerShippingDetails: { [key: string]: SellerShippingDetails };
  totalShippingCharge: number;
  maxDeliveryDays: number;
}

interface GSTPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gstData: { gstid: string; companyName: string }) => void;
}

const GSTPopup: React.FC<GSTPopupProps> = ({ isOpen, onClose, onSave }) => {
  const [gstData, setGstData] = useState({ gstid: "", companyName: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await onSave(gstData);
      onClose();
    } catch (error) {
      console.error("Error saving GST details:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle dialog state changes
  const handleOpenChange = (open: boolean) => {
    // Only allow closing through buttons
    if (open === false) {
      return; // Do nothing when trying to close by clicking outside
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
      modal={true}
    >
      <DialogContent 
        className="sm:max-w-[425px] [&>button]:hidden"
        onPointerDownOutside={(e) => {
          e.preventDefault(); // Prevent closing on click outside
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault(); // Prevent closing on Escape key
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Enter GST Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={gstData.companyName}
              onChange={(e) => setGstData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Enter company name"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="gstid" className="text-sm font-medium text-gray-700">
              GST ID
            </label>
            <input
              id="gstid"
              type="text"
              value={gstData.gstid}
              onChange={(e) => setGstData(prev => ({ ...prev, gstid: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Enter GST ID"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CheckoutContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"address" | "payment">("address");
  const [showGSTPopup, setShowGSTPopup] = useState<boolean>(true); // Initialize as true by default
  const [hasCheckedGST, setHasCheckedGST] = useState<boolean>(false); // Add this state to track if we've checked GST details
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phone: "",
    doorNo: "",
    street: "",
    state: "",
    email: "",
    zipCode: "",
    landmark: "",
    city: "",
    country: "",
    companyName: "",
    gstid: ""
  });
  const [savedAddress, setSavedAddress] = useState<FormData | null>(null);

  // Add Shiprocket state
  const [shiprocketLocations, setShiprocketLocations] = useState<
    ShiprocketLocation[]
  >([]);
  const [selectedPickupLocation, setSelectedPickupLocation] =
    useState<ShiprocketLocation | null>(null);
  const [courierServices, setCourierServices] = useState<CourierService[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<CourierService | null>(
    null
  );
  const [serviceabilityLoading, setServiceabilityLoading] = useState(false);

  const {
    cartId,
    cartItems,
    updateQuantity,
    checkSelect,
    removeItem,
    checkout,
    checkoutItems,
    setCartId,
    setCartItems,
  } = useCartStore();
  const router = useRouter();

  const { data: session, status } = useSession();

  const { isPaymentProcessing, setIsPaymentProcessing, orderId, isPaymentSuccess } = usePaymentStore();

  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const variantId = searchParams.get("variantId");
  const quantity = searchParams.get("quantity");
  const [reviewsMap, setReviewsMap] = useState<Record<string, number>>({});

  const [checkoutsItems, setCheckoutsItems] = useState<CheckoutItem[]>([]);
  const [openSheetId, setOpenSheetId] = useState(null);
  const [selectedDiscounts, setSelectedDiscounts] = useState<SelectedDiscounts>(
    {}
  );
  const [showGstBreakdown, setShowGstBreakdown] = useState(false);
  const [showDiscountBreakdown, setShowDiscountBreakdown] = useState(false);
  const [showShippingBreakdown, setShowShippingBreakdown] = useState(false);

  console.log(`🔥🔥🔥🔥🔥 - `, checkoutsItems);

  const [loading, setLoading] = useState(true);
  const [shippingLoading, setShippingLoading] = useState(false);

  const { data, update } = useSession();
  console.log(data?.user, status);

  const [animationData, setAnimationData] = useState(null);

  // Add new state for seller-specific shipping details
  const [sellerShippingDetails, setSellerShippingDetails] = useState<{
    [key: string]: SellerShippingDetails;
  }>({});
  const [totalShippingCharge, setTotalShippingCharge] = useState(0);
  const [maxDeliveryDays, setMaxDeliveryDays] = useState(0);

  // Update state for shipping details
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails[]>([]);

  // Calculate minimal shipping charge using admin pickup location
  const [adminShippingCharge, setAdminShippingCharge] = useState<number | null>(null);
  const calculateAdminShippingCharge = async (deliveryPincode: string) => {
    if (!deliveryPincode || deliveryPincode.length < 6) {
      toast.error("Invalid delivery postal code");
      return;
    }
    try {
      const items = checkoutsItems.map((item) => ({
        weight: Number(item.productVariant?.productWeight) || 0.5,
      }));
      const payload = {
        delivery_postcode: deliveryPincode,
        items,
        cod: false,
      };
      const response = await axios.post("/api/shiprocket/admin-shipping-charge", payload);
      if (response.data.success && response.data.data?.data?.available_courier_companies) {
        // Use the recommended courier or the lowest rate
        const companies = response.data.data.data.available_courier_companies;
        const recommended = response.data.data.data.recommended_courier_company_id;
        let minRate = Math.min(...companies.map((c: any) => c.rate));
        if (recommended) {
          const rec = companies.find((c: any) => c.courier_company_id === recommended);
          if (rec) minRate = rec.rate;
        }
        setAdminShippingCharge(minRate);
        toast.success(`Minimal shipping charge: ₹${minRate}`);
      } else {
        setAdminShippingCharge(null);
        toast.error("No minimal shipping charge found");
      }
    } catch (error: any) {
      setAdminShippingCharge(null);
      toast.error(error.message || "Failed to calculate minimal shipping charge");
    }
  };

  // Fetch Shiprocket pickup locations
  const fetchShiprocketLocations = async () => {
    try {
      console.log("Fetching Shiprocket locations...");
      const response = await axios.get("/api/shiprocket/location", {
        timeout: 10000, // 10 second timeout
        headers: {
          "x-user": JSON.stringify({
            sellerId: session?.user?.sellerId || data?.user?.sellerId,
          }),
        },
      });

      console.log("Shiprocket locations response:", response.data);

      if (response.data.success && response.data.data?.data?.shipping_address) {
        const locations = response.data.data.data.shipping_address;
        setShiprocketLocations(locations);

        // Set first location as default
        if (locations.length > 0) {
          setSelectedPickupLocation(locations[0]);
          console.log("Default pickup location set:", locations[0]);
          // toast.success("Pickup locations loaded successfully");
        } else {
          toast.warning("No pickup locations found");
        }
      } else {
        console.error("Invalid response structure:", response.data);
        toast.error("Failed to load pickup locations");
      }
    } catch (error) {
      console.error("Error fetching Shiprocket locations:", error);
      if (error.code === "ECONNABORTED") {
        toast.error("Request timed out while fetching pickup locations");
      } else if (error.response) {
        console.error("API Error Response:", error.response.data);
        toast.error(
          `Failed to fetch pickup locations: ${error.response.data?.message || "Unknown error"
          }`
        );
      } else {
        toast.error("Failed to fetch pickup locations");
      }
    }
  };

  // Calculate total weight of items (you might need to add weight field to your products)
  const calculateTotalWeight = () => {
    const totalWeight = checkoutsItems.reduce((total, item) => {
      const weight = Number(item.productVariant?.productWeight) || 0.5; // default 0.5kg if no weight specified
      return total + weight * item.quantity;
    }, 0);

    // Ensure minimum weight of 0.1kg for API compatibility
    return Math.max(totalWeight, 0.1);
  };

  // Update the checkCourierServiceability function
  const checkCourierServiceability = async (
    deliveryPincode: string,
    isCOD = false
  ) => {
    if (!deliveryPincode || deliveryPincode.length < 6) {
      console.error("Invalid delivery pincode:", deliveryPincode);
      toast.error("Invalid delivery postal code");
      return false;
    }

    setServiceabilityLoading(true);

    try {
      const items = checkoutsItems.map((item) => ({
        sellerProfileId: item.productVariant?.product?.sellerId,
        pickupPincode:
          item.productVariant?.product?.seller?.Pickuplocation?.[0]?.postcode,
        weight: item.productVariant?.productWeight || 0.5,
        cartItemId: item.cartItemId || item.id,
        productVariantId: item.productVariant?.id,
      }));

      const payload = {
        delivery_postcode: deliveryPincode,
        cod: isCOD,
        items: items,
      };

      console.log("Sending serviceability check payload:", payload);

      const response = await axios.post(
        "/api/shiprocket/multi-serviceability",
        payload
      );
      console.log("Serviceability response:", response.data);

      if (response.data.success) {
        const results = response.data.data;
        let allServicable = true;
        const newShippingDetails: ShippingDetails[] = [];
        let totalCharge = 0;
        let maxDays = 0;

        // Check if results is an array and has items
        if (!Array.isArray(results) || results.length === 0) {
          toast.error("No shipping services available");
          return false;
        }

        for (const result of results) {
          const { cartItemId, success, data, error } = result;

          if (!success || !data) {
            allServicable = false;
            toast.error(`Service not available for item: ${error || 'No courier services available'}`);
            continue;
          }

          const cartItem = checkoutsItems.find(
            (item) => (item.cartItemId || item.id) === cartItemId
          );
          if (!cartItem) {
            console.error(`Cart item not found for ID: ${cartItemId}`);
            continue;
          }

          // Create courier service object directly from the data
          const courierService: CourierService = {
            courier_company_id: data.courier_company_id,
            courier_name: data.courier_name,
            estimated_delivery_days: data.estimated_delivery_days,
            rate: data.rate,
            freight_charge: data.freight_charge || 0,
            cod: data.cod || 0,
            etd: data.etd || '',
            rating: data.rating || 0,
            delivery_performance: data.delivery_performance || 0,
            pickup_performance: data.pickup_performance || 0,
            tracking_performance: data.tracking_performance || 0,
            is_surface: data.is_surface || false,
            is_rto_address_available: data.is_rto_address_available || false,
            pod_available: data.pod_available || '',
            realtime_tracking: data.realtime_tracking || '',
          };

          newShippingDetails.push({
            cartItemId,
            courierService,
            item: cartItem,
          });

          totalCharge += courierService.rate;
          maxDays = Math.max(maxDays, Number(courierService.estimated_delivery_days));

          toast.success(
            `Shipping available via ${courierService.courier_name}`
          );
        }

        setShippingDetails(newShippingDetails);
        setTotalShippingCharge(totalCharge);
        setMaxDeliveryDays(maxDays);

        return allServicable;
      }

      toast.error("Failed to check shipping availability");
      return false;
    } catch (error: any) {
      console.error("Error checking serviceability:", error);
      toast.error(
        error.response?.data?.message || "Failed to check serviceability"
      );
      return false;
    } finally {
      setServiceabilityLoading(false);
    }
  };

  // Updated handleAddressSelect function
  const handleAddressSelect = async (address: FormData) => {
    try {
      // Set the selected address with proper structure
      const selectedAddress = {
        id: address.id || "",
        userId: address.userId || session?.user?.id || "",
        fullName: session?.user?.name || address.fullName || "",
        email: session?.user?.email || address.email || "",
        phone: address.phone || "",
        doorNo: address.doorNo || "",
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
        landmark: address.landmark || "",
        country: address.country || "",
        companyName: address.companyName || "",
        gstid: address.gstid || ""
      };

      setSavedAddress(selectedAddress);
      setShowFirst(false);

      // Check courier serviceability with the selected address
      if (selectedAddress.zipCode) {
        toast.info("Checking service availability...");
        const isServiceable = await checkCourierServiceability(
          selectedAddress.zipCode,
          false
        );
        // Always trigger admin shipping charge calculation as well
        await calculateAdminShippingCharge(selectedAddress.zipCode);
        if (isServiceable) {
          setActiveTab("payment");
          toast.success("Address selected and service is available!");
        } else {
          toast.warning(
            "Address selected but service may be limited for this location"
          );
          setActiveTab("payment"); // Still allow to proceed
        }
      } else {
        toast.warning(
          "Unable to check service availability - missing postal code or pickup location"
        );
        setActiveTab("payment");
      }
    } catch (error) {
      console.error("Error selecting address:", error);
      toast.error("Failed to select address");
    }
  };

  // Helper function to get variant-specific image
  const getVariantImage = (item: CheckoutItem) => {
    const productVariant = item.productVariant;
    const product = item.productVariant?.product || item.product;

    if (!product) return "/placeholder.png";

    // First try to get image from productVariant (if it has ProductVariantImage)


    
    if (productVariant?.ProductVariantImage?.length > 0) {
      const primaryImage = productVariant.ProductVariantImage.find(
        (img) => img.isPrimary
      );
      return (
        primaryImage?.imageUrl || productVariant.ProductVariantImage[0].imageUrl
      );
    }

    // Fallback: find the variant in product.variants and get its image
    const variant = product.variants?.find(
      (v: any) => v.id === productVariant?.id
    );
    if (variant?.ProductVariantImage?.length > 0) {
      const primaryImage = variant.ProductVariantImage.find(
        (img: any) => img.isPrimary
      );
      return primaryImage?.imageUrl || variant.ProductVariantImage[0].imageUrl;
    }

    // Final fallback: use product-level image
    const primaryProductImage = product.images?.find(
      (img: any) => img.isPrimary
    );
    return (
      primaryProductImage?.imageUrl ||
      product.images?.[0]?.imageUrl ||
      "/placeholder.png"
    );
  };

  // Helper function to get variant details
  const getVariantDetails = (item: CheckoutItem) => {
    const productVariant = item.productVariant;
    const product = item.productVariant?.product || item.product;

    if (!product) return { title: "", variantInfo: "" };

    const title = productVariant?.title || product.name || "Unnamed Product";
    const variantInfo =
      productVariant?.variantType && productVariant?.variantValue
        ? `${productVariant.variantType}: ${productVariant.variantValue}`
        : "";

    return { title, variantInfo };
  };

  // Helper function to get variant-specific discounts
  const getVariantDiscounts = (item: CheckoutItem) => {
    const productVariant = item.productVariant;
    const product = item.productVariant?.product || item.product;

    // Helper to filter discounts by today's date
    const isDiscountValidToday = (discount: any) => {
      // Cast discountType to Discount type for type safety
      const discountTyped: Discount = {
        ...discount,
        discountType: discount.discountType as "percentage" | "amount",
      };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(discountTyped.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(discountTyped.endDate);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    };

    // First try to get discounts from productVariant
    if (productVariant?.discounts?.length > 0) {
      return productVariant.discounts?.filter(isDiscountValidToday) || [];
    }

    // Fallback: find the variant in product.variants and get its discounts
    const variant = product?.variants?.find(
      (v: any) => v.id === productVariant?.id
    );
    if (variant?.discounts?.length > 0) {
      return variant.discounts?.filter(isDiscountValidToday) || [];
    }

    // Final fallback: use product-level discounts (if no variant-specific discounts)
    return (product?.discounts || []).filter(isDiscountValidToday);
  };

  useEffect(() => {
    console.log("Session data:", session);
    console.log("User data:", data);

    const loadAnimation = async () => {
      const res = await fetch("/assets/animationData.json");
      const data = await res.json();
      setAnimationData(data);
    };

    const checkGSTDetails = async () => {
      if (!session?.user?.id || hasCheckedGST) return;

      try {
        const response = await axios.get("/api/user");
        if (response.data?.status === 'success') {
          const userData = response.data.data;
          setHasCheckedGST(true);
          
          if (userData.gstid && userData.companyName) {
            setShowGSTPopup(false);
            setFormData(prev => ({
              ...prev,
              gstid: userData.gstid || "",
              companyName: userData.companyName || ""
            }));
          } else {
            setShowGSTPopup(true);
          }
        }
      } catch (error) {
        console.error("Error checking GST details:", error);
        setShowGSTPopup(true);
      }
    };

    loadAnimation();
    // Only fetch locations if we have session data
    if (session?.user?.sellerId || data?.user?.sellerId) {
      fetchShiprocketLocations();
    }
    
    // Check for existing GST details when component mounts
    if (session?.user?.id) {
      checkGSTDetails();
    }
  }, [session?.user?.id, hasCheckedGST]);

  const handleCheckout = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in ");
      return;
    }

    try {
      setShippingLoading(true);
      // First save the new address and update user data
      const productData = {
        userId: session.user.id,
        fullName: formData.fullName || session.user.name || null,
        email: formData.email || session.user.email || null,
        street: `${formData.doorNo}, ${formData.street}`,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone || null,
        landmark: formData.landmark || null,
        // Add user profile update data
        userData: {
          companyName: formData.companyName || null,
          gstid: formData.gstid || null
        }
      };

      // First update the user profile with company and GST details
      await axios.patch("/api/user", {
        companyName: formData.companyName || null,
        gstid: formData.gstid || null
      });

      // Then save the address
      const response = await axios.post(
        "/api/user/shippingAddress",
        productData
      );
      
      if (!response.data?.data?.id) {
        throw new Error("Failed to get address ID from response");
      }

      // Set the saved address with the response data
      const savedAddressData = {
        id: response.data.data.id,
        userId: session.user.id,
        fullName: formData.fullName || session.user.name || "",
        email: formData.email || session.user.email || "",
        doorNo: formData.doorNo || "",
        street: formData.street || "",
        city: formData.city || "",
        state: formData.state || "",
        zipCode: formData.zipCode || "",
        country: formData.country || "",
        phone: formData.phone || "",
        landmark: formData.landmark || "",
        companyName: formData.companyName || "",
        gstid: formData.gstid || ""
      };
      
      setSavedAddress(savedAddressData);
      setShowFirst(false);

      // Check courier serviceability with the new address
      if (savedAddressData.zipCode) {
        toast.info("Checking service availability...");
        const isServiceable = await checkCourierServiceability(
          savedAddressData.zipCode,
          false
        );
        if (isServiceable) {
          setActiveTab("payment");
          toast.success("Address saved and service is available!");
        } else {
          toast.warning(
            "Address saved but service may be limited for this location"
          );
          setActiveTab("payment"); // Still allow to proceed
        }
      } else {
        toast.warning(
          "Unable to check service availability - missing postal code"
        );
        setActiveTab("payment");
      }
    } catch (error: any) {
      console.error("Error saving address:", error.response ? error.response.data : error);
      toast.error("Failed to save the address. Please fill all the fields.");
    } finally {
      setShippingLoading(false);
    }
  };

  const [addresses, setAddresses] = useState<FormData[]>([]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await axios.get("/api/user/shippingAddress");
        if (res.data?.data) {
          setAddresses(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setShippingLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const handleUpdateAddress = async () => {
    try {
      const payload = {
        id: formData.id,
        userId: formData.userId,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone,
      };

      const response = await axios.put("/api/user/shippingAddress", payload);
      console.log("Address updated:", response.data);
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const [showFirst, setShowFirst] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProduct = async () => {
    try {
      if (!variantId) {
        throw new Error("Variant ID is required");
      }

      const variantResponse = await axios.post(`/api/products/variant`, {
        id: variantId,
      });

      console.log("Variant response:", variantResponse);

      if (!variantResponse.data?.data) {
        throw new Error("Variant data not found");
      }

      const variantData = variantResponse.data.data;

      console.log("variantData", variantData?.product?.seller?.Pickuplocation);

      if (!productId) {
        throw new Error("Product ID is required");
      }

      const productResponse = await axios.get(`/api/products/${productId}`);
      const productData = productResponse.data?.data;

      if (!productData) {
        throw new Error("Product data not found");
      }

      const formattedItem = {
        id: `${productData.id}-${variantData.id}`,
        productVariant: {
          id: variantData.id,
          price: variantData.price,
          title: variantData.title,
          description: variantData.description,
          variantType: variantData.variantType,
          variantValue: variantData.variantValue,
          stockQuantity: variantData.stockQuantity,
          productWeight: variantData.productWeight,
          ProductVariantImage: variantData.ProductVariantImage || [],
          discounts: variantData.discounts || [],
          product: {
            ...productData,
            discounts: productData.discounts || [],
            seller: {
              ...productData.seller,
              storeName: productData.seller?.storeName || null,
              gst: productData.seller?.gst || null,
              Pickuplocation: variantData.product?.seller?.Pickuplocation || null,
            },
          },
        },
        product: {
          id: productData.id,
          name: productData.name,
          description: productData.description,
          sellerId: productData.sellerId,
          images: productData.images || [],
          discounts: productData.discounts || [],
          seller: {
            ...productData.seller,
            storeName: productData.seller?.storeName || null,
            gst: productData.seller?.gst || null,
          },
        },
        quantity: Number(quantity) || 1,
      };

      setCheckoutsItems([formattedItem]);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      setCheckoutsItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartData = async () => {
    if (!data?.user?.id) {
      console.warn("No user ID available. Skipping cart fetch.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get("/api/user/cart", {
        params: { userId: data.user.id },
      });

      const cartData = response.data.data;

      if (!_.isEmpty(cartData)) {
        setCartId(cartData.id);
        setCartItems(cartData.items);
        setCheckoutsItems(cartData.items);
      } else {
        console.log("Cart is empty.");
      }
    } catch (error) {
      console.error("Failed to fetch cart data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId && variantId) {
      fetchProduct();
    } else if (status === "authenticated" && data?.user?.id) {
      fetchCartData();
    } else {
      setLoading(false);
    }
  }, [productId, variantId, data?.user?.id, status, quantity]);

  const getAverageRating = (product: any) => {
    if (
      !product.reviews ||
      (Array.isArray(product.reviews) && product.reviews.length === 0)
    )
      return "N/A";

    if (typeof product.reviews === "number") return product.reviews.toString();

    const validReviews = product.reviews.filter(
      (review: SubmittedReview) => review.rating
    );
    if (validReviews.length === 0) return "N/A";

    const avgRating =
      validReviews.reduce(
        (sum: number, review: SubmittedReview) => sum + review.rating,
        0
      ) / validReviews.length;
    return avgRating.toFixed(1);
  };

  // Calculate totals using correct tax calculation order (discount first, then GST)
  const calculationResults = checkoutsItems.reduce((acc, item) => {
    const product = item.productVariant?.product || item.product;
    const basePrice = Number(item.productVariant?.price || 0);
    const quantity = item.quantity;
    const selectedDiscount = selectedDiscounts[item.productVariant?.id];
    const gstPercentage = Number(product?.GST?.percentage || 0);

    // Step 1: Apply discount to get discounted price per unit
    let discountedPrice = basePrice;
    let discountAmount = 0;
    
    if (selectedDiscount) {
      if (selectedDiscount.discountType === "percentage") {
        discountAmount = (basePrice * Number(selectedDiscount.discountValue)) / 100;
        discountedPrice = basePrice - discountAmount;
      } else {
        discountAmount = Number(selectedDiscount.discountValue);
        discountedPrice = basePrice - discountAmount;
      }
    }

    // Step 2: Calculate GST on the discounted price (per unit)
    const gstAmountPerUnit = (discountedPrice * gstPercentage) / 100;
    
    // Step 3: Calculate totals for this item
    const itemSubtotal = basePrice * quantity; // Original price × quantity (for display)
    const itemDiscountTotal = discountAmount * quantity; // Total discount for this item
    const itemGstTotal = gstAmountPerUnit * quantity; // Total GST for this item
    const itemFinalTotal = (discountedPrice + gstAmountPerUnit) * quantity; // Final amount for this item

    return {
      subtotal: acc.subtotal + itemSubtotal,
      totalDiscount: acc.totalDiscount + itemDiscountTotal,
      totalGst: acc.totalGst + itemGstTotal,
      finalTotal: acc.finalTotal + itemFinalTotal,
    };
  }, {
    subtotal: 0,
    totalDiscount: 0,
    totalGst: 0,
    finalTotal: 0,
  });

  // Extract calculated values
  const totalAmount = calculationResults.subtotal;
  const totalDiscount = calculationResults.totalDiscount;
  const totalGst = calculationResults.totalGst;

  // Calculate shipping charges
  const shippingCharges = selectedCourier ? selectedCourier.rate : 0;

  // Check if order qualifies for free delivery (above ₹5000)
  const FREE_DELIVERY_THRESHOLD = 5000;
  const isEligibleForFreeDelivery = calculationResults.finalTotal >= FREE_DELIVERY_THRESHOLD;

  // Show toast notification when free delivery becomes available
  useEffect(() => {
    if (isEligibleForFreeDelivery && calculationResults.finalTotal > 0) {
      toast.success(`🎉 Congratulations! You've qualified for FREE delivery on orders above ₹${FREE_DELIVERY_THRESHOLD}!`, {
        duration: 4000,
      });
    }
  }, [isEligibleForFreeDelivery, calculationResults.finalTotal]);

  // Calculate final amount including shipping charges
  const baseShippingCharge = adminShippingCharge !== null ? adminShippingCharge : totalShippingCharge;
  const shippingChargeToUse = isEligibleForFreeDelivery ? 0 : baseShippingCharge;
  const amountPayable = calculationResults.finalTotal + shippingChargeToUse;

  const handleProductClick = (id: string) => {
    router.push(`/product/${id}`);
  };

  const validateAddressForPayment = (address: FormData | null) => {
    if (!address) {
      toast.error("Please select a delivery address");
      return false;
    }

    const requiredFields = [
      "phone",
      "street",
      "city",
      "state",
      "zipCode",
      "country",
    ];
    const missingFields = requiredFields.filter(
      (field) => !address[field as keyof FormData]
    );

    if (missingFields.length > 0) {
      toast.error(
        `Missing required address fields: ${missingFields.join(", ")}`
      );
      return false;
    }

    return true;
  };

  if (loading) {
    return <ShippingPageLoader />;
  }

  // Updated payment handlers with serviceability check
  const handlePayOnline = async (
    handlePayment: (orderData: any, cartId?: string | undefined) => void
  ) => {
    try {
      if (!session?.user?.id) {
        toast.error("Please log in to complete your purchase");
        return;
      }

      if (!validateAddressForPayment(savedAddress)) {
        setActiveTab("address");
        return;
      }

      // Check if we have shipping details for all items
      if (shippingDetails.length !== checkoutsItems.length) {
        toast.error("Not all items are serviceable. Please review your cart.");
        return;
      }

      console.log("shippingDetails", shippingDetails);

      const userId = session.user.id;
      const shippingAddressId = savedAddress?.id;

      if (!shippingAddressId) {
        toast.error("Address ID not found. Please reselect your address.");
        setActiveTab("address");
        return;
      }

      // Create items array with shipping details and ensure priceAtPurchase is a number
      const items = shippingDetails.map((detail) => {
        const product = detail.item.productVariant?.product;
        const selectedDiscount =
          selectedDiscounts[detail.item.productVariant?.id];

        // Calculate base price and ensure it's a number
        const basePrice = Number(detail.item.productVariant?.price || 0);
        const priceAtPurchase = selectedDiscount
          ? selectedDiscount.discountType === "percentage"
            ? basePrice -
              (basePrice * Number(selectedDiscount.discountValue)) /
                100
            : basePrice - Number(selectedDiscount.discountValue)
          : basePrice;

        // Calculate GST amount for this item
        const gstPercentage = product?.GST?.percentage || 0;
        const gstAmount = (priceAtPurchase * gstPercentage) / 100;

        return {
          productVariantId: detail.item.productVariant.id,
          sellerId: product?.sellerId,
          quantity: detail.item.quantity,
          priceAtPurchase: Number(priceAtPurchase.toFixed(2)), // Ensure it's a number
          gstAtPurches: Number(gstPercentage), // Add the GST percentage
          gstAmountAtPurchase: Number(gstAmount.toFixed(2)), // Add GST amount
          discountId: selectedDiscount?.id || "",
          discountAmountAtPurchase: selectedDiscount
            ? selectedDiscount.discountType === "percentage"
              ? Number(
                  (
                    (basePrice * Number(selectedDiscount.discountValue)) /
                    100
                  ).toFixed(2)
                )
              : Number(selectedDiscount.discountValue.toFixed(2))
            : 0,
          courierServiceId: detail.courierService.courier_company_id,
          shippingCharge: isEligibleForFreeDelivery ? 0 : Number(detail.courierService.rate.toFixed(2)), // Apply free delivery logic
          // Add shipment data for draft shipments
          draftShipment: {
            pickupLocationId: Number(
              product?.seller?.Pickuplocation[0]?.location_id || 0
            ),
            courierServiceId: detail.courierService.courier_company_id,
            shippingCharge: isEligibleForFreeDelivery ? 0 : Number(detail.courierService.rate.toFixed(2)), // Apply free delivery logic
            shipmentStatus: "draft",
            AWB: "", // This will be generated later
          },
        };
      });

      // Calculate total amount including GST and shipping charges
      const calculatedAmount = items.reduce((total, item) => {
        const itemTotal = Number(item.priceAtPurchase) * item.quantity;
        const gstAmount = Number(item.gstAmountAtPurchase) * item.quantity;
        return total + itemTotal + gstAmount;
      }, 0);

      // Always use adminShippingCharge (if available) for shippingCharges and totalAmount
      const baseShippingCharge = adminShippingCharge !== null ? adminShippingCharge : totalShippingCharge;
      const finalShippingCharge = isEligibleForFreeDelivery ? 0 : baseShippingCharge;
      const payload = {
        userId,
        shippingAddressId,
        totalAmount: calculatedAmount + finalShippingCharge,
        shippingCharges: finalShippingCharge,
        items: items.map(({ draftShipment, ...item }) => ({
          ...item,
          draftShipment: draftShipment, // Include shipment data for draft creation
        })),
      };

      console.log("Payment payload:", payload);


      console.log("is cartId", !(productId && variantId && quantity) && cartId ? cartId : undefined)

      setIsLoading(true);
      await handlePayment(
        payload,
        !(productId && variantId && quantity) && cartId ? cartId : undefined
      );
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(
        error.message ||
          "There was an error processing your payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // New COD payment handler
  const handleCODPayment = async (handlePayment: (orderData: any) => void) => {
    try {
      if (!session?.user?.id) {
        toast.error("Please log in to complete your purchase");
        return;
      }

      if (!savedAddress) {
        toast.error(
          "Please select a shipping address before proceeding to payment"
        );
        return;
      }

      // Check serviceability for COD
      const isServiceable = await checkCourierServiceability(
        savedAddress.zipCode,
        true
      );
      if (!isServiceable) {
        toast.error("Cash on Delivery not available for this location");
        return;
      }

      if (!selectedCourier) {
        toast.error("Please select a courier service");
        return;
      }

      const userId = session.user.id;

      const items = shippingDetails.map((detail) => {
        const product = detail.item.productVariant?.product;
        const basePrice = Number(detail.item.productVariant?.price || 0);
        const selectedDiscount = selectedDiscounts[detail.item.productVariant?.id];
        const gstPercentage = product?.GST?.percentage || 0;

        // Apply discount first, then calculate GST on discounted price
        let discountedPrice = basePrice;
        let discountAmount = 0;
        
        if (selectedDiscount) {
          if (selectedDiscount.discountType === "percentage") {
            discountAmount = (basePrice * Number(selectedDiscount.discountValue)) / 100;
            discountedPrice = basePrice - discountAmount;
          } else {
            discountAmount = Number(selectedDiscount.discountValue);
            discountedPrice = basePrice - discountAmount;
          }
        }

        const gstAmount = (discountedPrice * gstPercentage) / 100;

        return {
        productVariantId: detail.item.productVariant.id,
        sellerId: detail.item.productVariant.product.sellerId,
        quantity: detail.item.quantity,
          priceAtPurchase: Number(discountedPrice.toFixed(2)),
          gstAtPurches: Number(gstPercentage),
          gstAmountAtPurchase: Number(gstAmount.toFixed(2)),
        discountId: selectedDiscount?.id || "",
          discountAmountAtPurchase: Number(discountAmount.toFixed(2)),
          courierServiceId: detail.courierService.courier_company_id,
          shippingCharge: isEligibleForFreeDelivery ? 0 : Number(detail.courierService.rate.toFixed(2)), // Apply free delivery logic
          draftShipment: {
            pickupLocationId: Number(product?.seller?.Pickuplocation[0]?.location_id || 0),
            courierServiceId: detail.courierService.courier_company_id,
            shippingCharge: isEligibleForFreeDelivery ? 0 : Number(detail.courierService.rate.toFixed(2)), // Apply free delivery logic
            shipmentStatus: "draft",
            AWB: "",
          },
        };
      });

      const payload = {
        userId,
        totalAmount: amountPayable,
        shippingCharges: shippingChargeToUse,
        courierCompanyId: selectedCourier.courier_company_id,
        paymentMethod: "COD",
        items,
      };

      setIsLoading(true);
      await handlePayment(payload);
    } catch (error) {
      toast.error(
        "There was an error processing your COD order. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle saving GST details
  const handleSaveGSTDetails = async (gstData: { gstid: string; companyName: string }) => {
    try {
      if (!session?.user?.id) {
        toast.error("Please log in first");
        return;
      }

      await axios.patch("/api/user", {
        gstid: gstData.gstid,
        companyName: gstData.companyName
      });

      setFormData(prev => ({
        ...prev,
        gstid: gstData.gstid,
        companyName: gstData.companyName
      }));

      toast.success("GST details saved successfully");
    } catch (error) {
      console.error("Error saving GST details:", error);
      toast.error("Failed to save GST details");
    }
  };

  return (
    <>
      {/* Move the GSTPopup before other components */}
      <GSTPopup
        isOpen={showGSTPopup}
        onClose={() => setShowGSTPopup(false)}
        onSave={handleSaveGSTDetails}
      />
      <PaymentLoadingScreen isVisible={isPaymentProcessing} />
      <OrderConfirmationOverlay isOpen={isPaymentSuccess} orderId={orderId} onClose={() => { }} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6  w-full">
        <div className="lg:col-span-3">
          <div className="">
            {/* Tabs */}
            <div className="lg:col-span-3">
              <div className="flex w-full bg-gray-200 rounded-full overflow-hidden">
                {["address", "payment"].map((tab) => (
                  <button
                    key={tab}
                    className={`flex-1 text-center py-3 font-medium transition-all duration-300 ${activeTab === tab
                        ? "bg-red-700 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                    onClick={() => {
                      setActiveTab(tab as "address" | "payment");
                      if (tab === "address") {
                        setShowFirst(true);
                      }
                    }}
                  >
                    {tab === "address"
                      ? "Address & Product Summary"
                      : "Payment"}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 border rounded-lg mt-4 bg-white shadow lg:col-span-3">
              {activeTab === "address" ? (
                <>
                  {showFirst && (
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
                      <div className="flex justify-end">
                        <button
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                          onClick={() => setShowFirst(false)}
                        >
                          Add New
                        </button>
                      </div>

                      {addresses.length > 0 ? (
                        addresses.map((address, index) => (
                          <div
                            key={address.id || index}
                            className="relative bg-white rounded-2xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition duration-300"
                          >
                            <div className="flex justify-end gap-2 mb-3">
                              <button
                                className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-3 py-1 rounded-md shadow transition-colors"
                                onClick={() => {
                                  setFormData({
                                    id: address.id || "",
                                    userId: session?.user?.id || "",
                                    fullName: session?.user?.name || "",
                                    email: session?.user?.email || "",
                                    phone: address.phone || "",
                                    zipCode: address.zipCode || "",
                                    doorNo: address.doorNo || "",
                                    landmark: address.landmark || "",
                                    street: address.street || "",
                                    city: address.city || "",
                                    state: address.state || "",
                                    country: address.country || "",
                                    companyName: address.companyName || "",
                                    gstid: address.gstid || ""
                                  });
                                  setShowFirst(false);
                                  setIsEditing(true);
                                }}
                              >
                                Edit
                              </button>

                              <button
                                className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-1 rounded-md shadow transition-colors"
                                onClick={() => handleAddressSelect(address)}
                              >
                                Select This Address
                              </button>
                            </div>

                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-red-600">
                                {address.fullName || session?.user?.name}
                              </h3>
                              <p className="text-gray-700">
                                {address.doorNo && `${address.doorNo}, `}
                                {address.street}
                              </p>
                              <p className="text-gray-700">
                                {address.city}, {address.state} -{" "}
                                {address.zipCode}
                              </p>
                              <p className="text-gray-700">{address.country}</p>
                              <p className="text-gray-700 font-medium">
                                📞 {address.phone}
                              </p>
                              {address.landmark && (
                                <p className="text-sm text-gray-500">
                                  Landmark: {address.landmark}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            No saved addresses found.
                          </p>
                          <button
                            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            onClick={() => setShowFirst(false)}
                          >
                            Add New Address
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✅ ADDRESS FORM SECTION */}
                  {!showFirst && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[
                          { name: "fullName", label: "Full Name" },
                          { name: "email", label: "Email" },
                          { name: "phone", label: "Phone" },
                          { name: "zipCode", label: "zipCode" },
                          { name: "doorNo", label: "Door No/Area/Building No" },
                          { name: "landmark", label: "Nearby Landmark" },
                          { name: "street", label: "Address" },
                          { name: "city", label: "City" },
                          { name: "state", label: "State" },
                          { name: "country", label: "Country" },
                          { name: "companyName", label: "Company Name" },
                          { name: "gstid", label: "GST ID" }
                        ].map((field) => (
                          <InputField
                            key={field.name}
                            name={field.name}
                            label={field.label}
                            placeholder={`Enter your ${field.label}`}
                            value={formData[field.name as keyof FormData] ?? ""}
                            onChange={handleChange}
                          />
                        ))}
                      </div>

                      {/* Buttons */}
                      <div className="flex justify-end gap-4 mt-6">
                        {!isEditing ? (
                          <>
                            <button
                              className="px-6 py-2 border border-gray-300 rounded-lg text-red-700 bg-red-100"
                              onClick={() => setShowFirst(true)}
                            >
                              Cancel
                            </button>

                            <button
                              onClick={handleCheckout}
                              className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
                            >
                              Save & Checkout
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              handleUpdateAddress();
                              setShowFirst(true);
                              setIsEditing(false); // back to normal view
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded"
                          >
                            Save Changes
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                // PAYMENT SUMMARY
                <div>
                  <div className="w-full">
                    {checkoutsItems?.length > 0 && (
                      <div>
                        {/* Large Screen Table */}
                        <div className="hidden lg:block overflow-x-auto w-full">
                          <table className="w-full min-w-[600px] border-collapse">
                            <thead>
                              <tr className="bg-gray-100 text-sm text-center">
                                <th className="p-2 w-2/12">
                                  {checkoutsItems.length} items
                                </th>
                                <th className="p-2 w-2/12">Quantity</th>
                                <th className="p-2 w-2/12">Price</th>
                                <th className="p-2 w-2/12">GST</th>
                                <th className="p-2 w-2/12">Discount</th>
                                <th className="p-2 w-2/12">Final Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {checkoutsItems?.map((item) => {
                                const product =
                                  item?.productVariant?.product || item.product;
                                if (!product) return null;

                                const productId = product.id;
                                const variantImage = getVariantImage(item);
                                const { title, variantInfo } =
                                  getVariantDetails(item);
                                const variantDiscounts =
                                  getVariantDiscounts(item);

                                return (
                                  <tr
                                    key={item.id || productId}
                                    className="border-t h-32 text-center"
                                  >
                                    <td className="p-2">
                                      <div className="flex items-start gap-4 relative">
                                        <img
                                          onClick={() =>
                                            handleProductClick(productId)
                                          }
                                          src={
                                            variantImage || "/placeholder.svg"
                                          }
                                          alt={title}
                                          className="w-24 h-24 object-contain cursor-pointer flex-shrink-0"
                                        />

                                        <div className="text-left">
                                          <p
                                            className="font-bold text-black cursor-pointer text-sm truncate max-w-[200px]"
                                            onClick={() =>
                                              handleProductClick(productId)
                                            }
                                            title={title}
                                          >
                                            {title}
                                          </p>
                                          {variantInfo && (
                                            <p className="text-xs text-gray-600 mt-1">
                                              {variantInfo}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-white bg-green-900 flex items-center gap-1 px-2 py-1 rounded text-xs">
                                              <Star className="w-3 h-3 fill-white" />
                                              {reviewsMap[productId] ||
                                                getAverageRating(product) ||
                                                "N/A"}
                                            </span>
                                            <span className="text-gray-500 text-xs font-semibold">
                                              {item.reviews
                                                ? `(${item.reviews} Reviews)`
                                                : ""}
                                            </span>
                                          </div>
                                          <span
                                            className="text-gray-500 text-sm block mt-1 truncate max-w-[200px]"
                                            title={
                                              item.productVariant
                                                ?.description ||
                                              product.description
                                            }
                                          >
                                            {item.productVariant?.description ||
                                              product.description}
                                          </span>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="p-2">
                                      <div className="flex items-center justify-center">
                                        <input
                                          type="text"
                                          className="w-8 text-center border-0 bg-transparent"
                                          value={item.quantity}
                                          readOnly
                                        />
                                      </div>
                                    </td>

                                    <td className="p-2 font-bold text-center">
                                      {selectedDiscounts[
                                        item.productVariant?.id
                                      ] ? (
                                        <>
                                          <p className="text-sm text-gray-400 line-through">
                                            ₹
                                            {Number(
                                              item.productVariant?.price ||
                                                product.price
                                            ).toFixed(2)}
                                          </p>
                                          <p className="text-green-700 font-bold text-lg">
                                            ₹
                                            {(() => {
                                              const price = Number(
                                                item.productVariant?.price ||
                                                  product.price
                                              );
                                              const discount =
                                                selectedDiscounts[
                                                  item.productVariant?.id
                                                ];
                                              if (
                                                discount.discountType ===
                                                "percentage"
                                              ) {
                                                return (
                                                  price -
                                                  (price *
                                                    Number(
                                                      discount.discountValue
                                                    )) /
                                                    100
                                                ).toFixed(2);
                                              } else {
                                                return (
                                                  price -
                                                  Number(discount.discountValue)
                                                ).toFixed(2);
                                              }
                                            })()}
                                          </p>
                                        </>
                                      ) : (
                                        <p>
                                          ₹
                                          {Number(
                                            item.productVariant?.price ||
                                              product.price
                                          ).toFixed(2)}
                                        </p>
                                      )}
                                      <p
                                        className="text-blue-600 hover:underline cursor-pointer text-xs"
                                        onClick={() =>
                                          handleProductClick(productId)
                                        }
                                      >
                                        Product Details
                                      </p>
                                    </td>

                                    <td className="p-2 font-bold">
                                      <div></div>
                                      {product.GST?.percentage
                                        ? `${product.GST.percentage}%`
                                        : "N/A"}
                                    </td>

                                    <td className="p-2 font-bold">
                                      {variantDiscounts?.length > 0 ? (
                                        <div className="flex flex-col items-center">
                                          {selectedDiscounts[
                                            item.productVariant?.id
                                          ] ? (
                                            <>
                                              <span>
                                                {selectedDiscounts[
                                                  item.productVariant?.id
                                                ].discountType === "percentage"
                                                  ? `${selectedDiscounts[
                                                        item.productVariant?.id
                                                      ].discountValue
                                                    }%`
                                                  : `₹${selectedDiscounts[
                                                        item.productVariant?.id
                                                      ].discountValue
                                                    }`}
                                              </span>
                                              <button
                                                onClick={() =>
                                                  setOpenSheetId(
                                                    item.id || product.id
                                                  )
                                                }
                                                className="text-xs text-blue-500 hover:underline mt-1"
                                              >
                                                Change
                                              </button>
                                            </>
                                          ) : (
                                            <button
                                              onClick={() =>
                                                setOpenSheetId(
                                                  item.id || product.id
                                                )
                                              }
                                              className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                            >
                                              Apply Discount
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        "N/A"
                                      )}
                                    </td>

                                    <td className="p-2 font-bold">
                                      ₹
                                      {(() => {
                                        const price = Number(
                                          item.productVariant?.price ||
                                            product.price
                                        );
                                        const quantity = item.quantity;
                                        const discount =
                                          selectedDiscounts[
                                            item.productVariant?.id
                                          ];
                                        const gstPercentage =
                                          product.GST?.percentage || 0;

                                        // Calculate price after discount
                                        let discountedPrice = price;
                                        if (discount) {
                                          if (
                                            discount.discountType ===
                                            "percentage"
                                          ) {
                                            discountedPrice =
                                              price -
                                              (price *
                                                Number(
                                                  discount.discountValue
                                                )) /
                                                100;
                                          } else {
                                            discountedPrice =
                                              price -
                                              Number(discount.discountValue);
                                          }
                                        }

                                        // Calculate GST on the discounted price
                                        const gstAmount =
                                          (discountedPrice * gstPercentage) /
                                          100;

                                        // Calculate final amount (discounted price + GST) multiplied by quantity
                                        const finalAmount =
                                          (discountedPrice + gstAmount) *
                                          quantity;

                                        return finalAmount.toFixed(2);
                                      })()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Small Screen Card */}
                        <div className="lg:hidden space-y-4">
                          {checkoutsItems.map((item) => {
                            const product =
                              item.productVariant?.product || item.product;
                            if (!product) return null;

                            const productId = product.id;
                            const variantImage = getVariantImage(item);
                            const { title, variantInfo } =
                              getVariantDetails(item);
                            const variantDiscounts = getVariantDiscounts(item);
                            const basePrice = Number(
                              item.productVariant?.price || product.price
                            );
                            const appliedDiscount =
                              selectedDiscounts[item.productVariant?.id];

                            // Calculate final price
                            const finalPrice = appliedDiscount
                              ? appliedDiscount.discountType === "percentage"
                                ? basePrice -
                                  (basePrice *
                                    Number(appliedDiscount.discountValue)) /
                                    100
                                : basePrice -
                                  Number(appliedDiscount.discountValue)
                              : basePrice;

                            return (
                              <div
                                key={item.id || productId}
                                className="bg-white p-4 rounded-lg shadow relative"
                              >
                                <div className="relative">
                                  {variantDiscounts?.length > 0 && (
                                    <button
                                      className="absolute top-2 right-2 flex items-center gap-1 text-green-600 text-xs cursor-pointer"
                                      onClick={() =>
                                        setOpenSheetId(item.id || product.id)
                                      }
                                    >
                                      <BadgePercent className="w-5 h-5" />
                                      <span>Discount</span>
                                    </button>
                                  )}
                                </div>

                                {openSheetId === (item.id || product.id) && (
                                  <Sheet
                                    open={true}
                                    onOpenChange={() => setOpenSheetId(null)}
                                  >
                                    <SheetContent
                                      side="right"
                                      className="w-screen max-w-none pt-[150px]"
                                    >
                                      <div
                                        className="flex items-center gap-2 mb-4 cursor-pointer"
                                        onClick={() => setOpenSheetId(null)}
                                      >
                                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                                        <span className="text-sm font-medium text-gray-700">
                                          Back
                                        </span>
                                      </div>

                                      <SheetHeader>
                                        <SheetTitle>
                                          Available Discounts
                                        </SheetTitle>
                                      </SheetHeader>

                                      <div className="mt-6 space-y-3">
                                        {variantDiscounts.map(
                                          (discount: Discount, idx: number) => (
                                            <div
                                              key={discount.id || idx}
                                              className="border p-3 rounded-md hover:bg-gray-100 cursor-pointer"
                                              onClick={() => {
                                                setSelectedDiscounts(
                                                  (prev) => ({
                                                    ...prev,
                                                    [item.productVariant?.id ||
                                                    ""]: {
                                                      ...discount,
                                                      discountValue: Number(
                                                        discount.discountValue
                                                      ),
                                                    },
                                                  })
                                                );
                                                setOpenSheetId(null);
                                              }}
                                            >
                                              <p className="text-sm font-medium text-gray-800">
                                                {discount.discountType ===
                                                "percentage"
                                                  ? `${discount.discountValue}% Off`
                                                  : `₹${discount.discountValue} Off`}
                                              </p>
                                              <p className="text-xs text-gray-500 mt-1">
                                                Valid from{" "}
                                                {new Date(
                                                  discount.startDate
                                                ).toLocaleDateString()}{" "}
                                                to{" "}
                                                {new Date(
                                                  discount.endDate
                                                ).toLocaleDateString()}
                                              </p>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </SheetContent>
                                  </Sheet>
                                )}

                                <div className="flex gap-4 mt-6">
                                  <img
                                    onClick={() =>
                                      handleProductClick(productId)
                                    }
                                    src={variantImage || "/placeholder.svg"}
                                    alt={title}
                                    className="w-20 h-20 object-contain flex-shrink-0 cursor-pointer"
                                  />

                                  <div className="flex-1 min-w-0">
                                    <p
                                      onClick={() =>
                                        handleProductClick(productId)
                                      }
                                      className="text-sm text-black font-bold truncate cursor-pointer"
                                      title={title}
                                    >
                                      {title}
                                    </p>

                                    {variantInfo && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        {variantInfo}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-white bg-green-900 flex items-center gap-1 px-2 py-1 rounded text-xs w-fit">
                                        <Star className="w-3 h-3 fill-white" />
                                        {reviewsMap[productId] ||
                                          getAverageRating(product) ||
                                          "N/A"}
                                      </span>
                                      <span className="text-gray-500 text-xs font-semibold">
                                        {item.reviews
                                          ? `(${item.reviews} Reviews)`
                                          : ""}
                                      </span>
                                    </div>

                                    <p
                                      className="text-gray-500 text-xs mt-1 truncate"
                                      title={
                                        item.productVariant?.description ||
                                        product.description
                                      }
                                    >
                                      {item.productVariant?.description ||
                                        product.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-2">
                                      <div className="flex items-center">
                                        <label className="text-xs text-gray-500">
                                          Qty:
                                        </label>
                                        <input
                                          type="text"
                                          className="w-8 text-center border-0 bg-transparent"
                                          value={item.quantity}
                                          readOnly
                                        />
                                      </div>
                                      <div className="text-right">
                                        {appliedDiscount ? (
                                          <>
                                            <p className="text-sm text-gray-400 line-through">
                                              ₹ {basePrice.toFixed(2)}
                                            </p>
                                            <p className="font-bold text-lg text-green-700">
                                              ₹ {finalPrice.toFixed(2)}
                                            </p>
                                          </>
                                        ) : (
                                          <p className="font-bold text-lg">
                                            ₹ {basePrice.toFixed(2)}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <p
                                      onClick={() =>
                                        handleProductClick(productId)
                                      }
                                      className="font-light text-blue-600 hover:underline cursor-pointer text-xs mt-1"
                                    >
                                      Product Details
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {activeTab === "payment" && (
                    <div className="flex flex-col justify-between h-65 mt-10">
                      <div>
                        <h2 className="text-lg font-medium mb-4 text-gray-500">
                          Delivery Address
                        </h2>
                        {savedAddress ? (
                          <div className="space-y-2 text-black border p-3 md:p-4 rounded-lg bg-gray-50 relative">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div className="space-y-1 md:space-y-2 w-full">
                                <p className="font-semibold text-sm md:text-base">
                                  {savedAddress.fullName || session?.user?.name}
                                </p>
                                <p className="text-sm md:text-base">
                                  {savedAddress.doorNo && `${savedAddress.doorNo}, `}
                                  {savedAddress.street}
                                </p>
                                <p className="text-sm md:text-base">
                                  {savedAddress.city}, {savedAddress.state} - {savedAddress.zipCode}
                                </p>
                                <p className="text-sm md:text-base">{savedAddress.country}</p>
                                <p className="font-medium text-sm md:text-base">
                                  Mobile: {savedAddress.phone}
                                </p>
                                {savedAddress.landmark && (
                                  <p className="text-xs md:text-sm text-gray-600">
                                    Landmark: {savedAddress.landmark}
                                  </p>
                                )}
                              </div>
                              <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                <button
                                  onClick={() => {
                                    setActiveTab("address");
                                    setShowFirst(true);
                                  }}
                                  className="w-full sm:w-auto px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-red-700 bg-red-200 text-xs md:text-sm font-medium hover:bg-red-300 transition-colors whitespace-nowrap"
                                >
                                  Change Address
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border p-3 md:p-4 rounded-lg bg-red-50">
                            <p className="text-red-600 text-sm md:text-base">
                              No address selected. Please go back and select an address.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {activeTab === "payment" && savedAddress && (
                    <div className="mt-4">
                      {/* <button
                        onClick={() => {
                          if (savedAddress.zipCode) {
                            checkCourierServiceability(savedAddress.zipCode, false)
                          }
                        }}
                        disabled={serviceabilityLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                      >
                        {serviceabilityLoading ? "Checking..." : "Check Service Availability"}
                      </button> */}

                      {courierServices.length > 0 && (
                        <div className="mt-2 p-2 bg-green-50 rounded">
                          <p className="text-sm text-green-800">
                            ✓ Service available with {courierServices.length}{" "}
                            courier option(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Payment Summary</h2>
            <hr className="border-t border-gray-300" />
            <div className="space-y-6 text-medium font-gray-500 w-full h-full">
              <div className="flex justify-between">
                <span>Total Amount</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>

              {/* Free Delivery Progress Indicator */}
              {!isEligibleForFreeDelivery && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-700 text-sm font-medium">
                      Add ₹{(FREE_DELIVERY_THRESHOLD - calculationResults.finalTotal).toFixed(2)} more for FREE delivery!
                    </span>
                    <span className="text-blue-600 text-xs">
                      {Math.round((calculationResults.finalTotal / FREE_DELIVERY_THRESHOLD) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((calculationResults.finalTotal / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <div className="flex items-center gap-1 flex-wrap">
                  <span>Total GST</span>
                  <button
                    onClick={() => setShowGstBreakdown(!showGstBreakdown)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    {showGstBreakdown ? "Hide" : "Show"} breakdown
                  </button>
              {showGstBreakdown && (
                    <div className="mb-4 text-xs text-gray-500 ml-2 flex flex-col w-full">
                  {checkoutsItems.map((item) => {
                        const product = item.productVariant?.product || item.product;
                        const gstPercentage = Number(product?.GST?.percentage) || 0;
                    const basePrice = Number(item.productVariant?.price);
                    const quantity = item.quantity;
                    if (!gstPercentage) return null;
                    
                        // Apply discount first
                        const selectedDiscount = selectedDiscounts[item.productVariant?.id];
                        let discountedPrice = basePrice;
                        
                        if (selectedDiscount) {
                          if (selectedDiscount.discountType === "percentage") {
                            discountedPrice = basePrice - (basePrice * Number(selectedDiscount.discountValue)) / 100;
                          } else {
                            discountedPrice = basePrice - Number(selectedDiscount.discountValue);
                          }
                        }
                        
                        // Get pickup state from seller's Pickuplocation[0].state
                        const pickupState = product?.seller?.Pickuplocation?.[0]?.state || "";
                        // Get delivery state from savedAddress
                        const deliveryState = savedAddress?.state || "";
                        const productGst = (discountedPrice * quantity * gstPercentage) / 100;
                        let gstLabel = "";
                        let gstDetails = "";
                        if (
                          pickupState &&
                          deliveryState &&
                          pickupState.toLowerCase().trim() === deliveryState.toLowerCase().trim()
                        ) {
                          // Same state: CGST + SGST
                          const half = gstPercentage / 2;
                          const halfAmount = productGst / 2;
                          gstLabel = `CGST + SGST`;
                          gstDetails = `${half}% + ${half}% - ₹${halfAmount.toFixed(2)} + ₹${halfAmount.toFixed(2)}`;
                        } else {
                          // Different state: IGST
                          gstLabel = `IGST`;
                          gstDetails = `${gstPercentage}% - ₹${productGst.toFixed(2)}`;
                        }
                    return (
                          <div key={item.id} className="flex justify-between w-full mb-1">
                            <span>{product?.name} (×{quantity})</span>
                            <span>{gstLabel}: {gstDetails}</span>
                      </div>
                    );
                  })}
                </div>
              )}
                </div>
                <span>₹{totalGst.toFixed(2)}</span>
              </div>


              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <span>Total Discount</span>
                  <button
                    onClick={() =>
                      setShowDiscountBreakdown(!showDiscountBreakdown)
                    }
                    className="text-xs text-blue-500 hover:underline"
                  >
                    {showDiscountBreakdown ? "Hide" : "Show"} breakdown
                  </button>
                </div>
                <span>₹{totalDiscount.toFixed(2)}</span>
              </div>

              {showDiscountBreakdown && (
                <div className="ml-4 border-l-2 pl-2 border-gray-200">
                  {checkoutsItems.map((item) => {
                    const product =
                      item.product || item.productVariant?.product;
                    const discount = selectedDiscounts[item.productVariant?.id];

                    if (!discount) return null;

                    const price = Number(item.productVariant?.price);
                    const quantity = item.quantity;
                    let productDiscount = 0;

                    if (discount.discountType === "percentage") {
                      productDiscount =
                        (price * quantity * Number(discount.discountValue)) /
                        100;
                    } else {
                      productDiscount =
                        Number(discount.discountValue) * quantity;
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="truncate max-w-[120px]">
                          {product?.name || "Product"}:
                        </span>
                        <span>
                          ₹{productDiscount.toFixed(2)} (
                          {discount.discountType === "percentage"
                            ? `${discount.discountValue}%`
                            : `₹${discount.discountValue} per item`}
                          )
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Shipping Charges Section */}
              <div className="flex justify-between">
                <span>Shipping Charges</span>
                <span>
                  {isEligibleForFreeDelivery ? (
                    <span className="text-green-600 font-semibold">FREE</span>
                  ) : (
                    `₹${(adminShippingCharge !== null ? adminShippingCharge : totalShippingCharge).toFixed(2)}`
                  )}
                </span>
              </div>

              {/* Free Delivery Message */}
              {isEligibleForFreeDelivery && (
                <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg">
                  <span className="text-green-700 text-sm font-medium">
                    🎉 Free Delivery Applied!
                  </span>
                  <span className="text-green-600 text-xs">
                    Orders above ₹{FREE_DELIVERY_THRESHOLD}
                  </span>
                </div>
              )}

              {showShippingBreakdown && (
                <div className="ml-4 border-l-2 pl-2 border-gray-200">
                  {shippingDetails.map((detail) => (
                    <div key={detail.cartItemId} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium text-gray-700">
                        <span>
                          {detail.item.productVariant?.title ||
                            detail.item.product?.name}
                        </span>
                        <span>₹{detail.courierService.rate.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pl-2">
                        <div className="truncate max-w-[180px]">
                          Qty: {detail.item.quantity}
                          <span className="block text-xs text-gray-400">
                            Weight:{" "}
                            {detail.item.productVariant?.productWeight || "0.5"}
                            kg
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">
                            {detail.courierService.estimated_delivery_days} days
                          </span>
                          <span className="block text-xs text-gray-400">
                            {detail.courierService.courier_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <hr className="border-t border-gray-300" />

              <div className="flex justify-between font-semibold pt-2 text-red-800">
                <span>Amount Payable</span>
                <span>₹{amountPayable.toFixed(2)}</span>
              </div>

              {/* EMI Affordability Widget */}
              {activeTab === "payment" && amountPayable > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                    <span className="mr-2">💳</span>
                    Flexible Payment Options
                  </h4>
                  <div className="text-xs text-blue-600 mb-2">
                    Choose from various EMI and payment options available
                  </div>
                  <RazorpayAffordabilityWidget
                    amount={Math.round(amountPayable * 100)} // Convert to paise
                    keyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""}
                    className="w-full"
                    onWidgetLoad={() => {
                      console.log("EMI Widget loaded successfully");
                    }}
                    onWidgetError={(error) => {
                      console.error("EMI Widget error:", error);
                    }}
                  />
                </div>
              )}

              {/* Show courier service info if available */}
              {selectedCourier && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800">
                    Recommended Shipping Service
                  </h4>
                  <p className="text-xs text-blue-600">
                    {selectedCourier.courier_name}
                  </p>
                  <p className="text-xs text-blue-600">
                    Delivery: {selectedCourier.estimated_delivery_days} days
                  </p>
                  <p className="text-xs text-blue-600">
                    Shipping: {isEligibleForFreeDelivery ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                      `₹${selectedCourier.rate.toFixed(2)}`
                    )}
                  </p>
                  {isEligibleForFreeDelivery && (
                    <p className="text-xs text-green-600 mt-1">
                      🎉 Free delivery applied for orders above ₹{FREE_DELIVERY_THRESHOLD}
                    </p>
                  )}
                  {selectedCourier.cod === 1 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Cash on Delivery Available
                    </p>
                  )}
                </div>
              )}

              {/* Show serviceability loading */}
              {serviceabilityLoading && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Checking service availability...
                  </p>
                </div>
              )}
              {/* Add this inside the payment summary UI */}
          
            </div>
          </div>

          {/* Updated Payment Buttons */}
          <br />
          <div className="flex flex-col gap-4">
            {/* Pay Online Button */}
            <PaymentButton
              customerInfo={{
                name: savedAddress?.fullName || session?.user?.name || "",
                email: savedAddress?.email || session?.user?.email || "",
                contact: savedAddress?.phone || "",
              }}
              onSuccess={() => {
                // router.push("/profile")
              }}
              onFailure={() => {
                // console.log("Payment failed")

              }}
              children={(handlePayment) => (
                <button
                  disabled={isLoading || serviceabilityLoading}
                  onClick={() => handlePayOnline(handlePayment)}
                  className={`w-full px-3 py-2 gap-13 border border-gray-300 rounded-lg text-white ${isLoading || serviceabilityLoading
                      ? "bg-gray-500"
                      : "bg-blue-500"
                  } flex items-center`}
                >
                  <div className="flex flex-col items-start flex-grow">
                    <span className="font-bold text-lg">
                      ₹{amountPayable.toFixed(2)}
                    </span>
                    {isLoading || serviceabilityLoading ? (
                      <span className="inline-block h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span className="text-[10px] whitespace-nowrap">
                        Pay Online
                      </span>
                    )}
                  </div>
                  <ChevronRight size={28} className="ml-auto" />
                </button>
              )}
            />

            {/* Cash on Delivery Button */}
            {/* <PaymentButton
              customerInfo={{
                name: savedAddress?.fullName || session?.user?.name || "",
                email: savedAddress?.email || session?.user?.email || "",
                contact: savedAddress?.phone || "",
              }}
              onSuccess={() => router.push("/profile")}
              onFailure={() => console.log("COD order failed")}
              children={(handlePayment) => (
                <button
                  disabled={isLoading || serviceabilityLoading}
                  onClick={() => handleCODPayment(handlePayment)}
                  className={`w-full px-3 py-2 gap-13 border border-gray-300 rounded-lg text-white ${
                    isLoading || serviceabilityLoading ? "bg-gray-500" : "bg-red-500"
                  } flex items-center`}
                >
                  <div className="flex flex-col items-start flex-grow">
                    <span className="font-bold text-lg">₹{amountPayable.toFixed(2)}</span>
                    {isLoading || serviceabilityLoading ? (
                      <span className="inline-block h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span className="text-[10px] whitespace-nowrap">Cash on Delivery</span>
                    )}
                  </div>
                  <ChevronRight size={28} className="ml-auto" />
                </button>
              )}
            /> */}
          </div>
        </div>
      </div>
    </>
  );
};

const CheckoutPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-500"></div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
};

export default CheckoutPage;
