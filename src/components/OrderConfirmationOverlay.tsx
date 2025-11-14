"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Check,
  Clock,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePaymentStore } from "@/store/paymentStore";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: string;
  discountAmountAtPurchase: string;
  gstAmountAtPurchase: string;
  shippingCharge: string;
  status: string;
  productVariant: {
    title: string;
    price: string;
    ProductVariantImage: { imageUrl: string; isPrimary: boolean }[];
    product: {
      name: string;
    };
  };
}

interface OrderData {
  id: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  items: OrderItem[];
  payments: {
    paymentGateway: string;
    transactionId: string;
    paymentDate: string;
    paymentGatewayOrderId: string;
  }[];
}

interface OrderConfirmationProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
}

const OrderConfirmationOverlay = ({
  isOpen,
  orderId,
  onClose,
}: OrderConfirmationProps) => {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setIsPaymentSuccess, setOrderId } = usePaymentStore();
  const router = useRouter();

  // Free delivery threshold constant
  const FREE_DELIVERY_THRESHOLD = 5000;

  // Calculate if free delivery was applied and get original shipping amount
  const getShippingInfo = () => {
    if (!orderData) return { isFreeDelivery: false, originalShippingAmount: 0, currentShippingAmount: 0 };
    
    const currentShippingAmount = orderData.items.reduce(
      (sum, item) => sum + Number.parseFloat(item.shippingCharge || "0"),
      0
    );
    
    // Calculate subtotal (without shipping and GST)
    const subtotal = orderData.items.reduce(
      (sum, item) => sum + Number.parseFloat(item.priceAtPurchase) * item.quantity,
      0
    );
    
    // If shipping is 0 and subtotal >= threshold, free delivery was applied
    // Also check if the order total suggests free delivery was applied
    const orderTotal = Number.parseFloat(orderData.totalAmount);
    const isFreeDelivery = (currentShippingAmount === 0 && subtotal >= FREE_DELIVERY_THRESHOLD) || 
                          (orderTotal >= FREE_DELIVERY_THRESHOLD && currentShippingAmount === 0);
    
    // For free delivery, estimate the original shipping amount based on order value
    // Higher value orders typically have higher shipping costs
    let estimatedOriginalShipping = 0;
    if (isFreeDelivery) {
      if (subtotal >= 10000) {
        estimatedOriginalShipping = 150; // Premium shipping for high-value orders
      } else if (subtotal >= 7000) {
        estimatedOriginalShipping = 120; // Standard shipping for medium-high orders
      } else {
        estimatedOriginalShipping = 99; // Standard shipping for orders just above threshold
      }
    } else {
      estimatedOriginalShipping = currentShippingAmount;
    }
    
    return {
      isFreeDelivery,
      originalShippingAmount: estimatedOriginalShipping,
      currentShippingAmount
    };
  };

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/orderdetails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: orderId }),
        });

        const data = await response.json();

        if (data.status === "success") {
          setOrderData(data.data);
        } else {
          setError("Failed to fetch order details");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return <Check className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-[999] flex justify-center items-center">
      <Card className="w-screen h-screen sm:w-full sm:h-full sm:max-w-4xl sm:max-h-[90vh] sm:rounded-xl flex flex-col relative sm:shadow-lg sm:mx-4">
        {/* Mobile-optimized header */}
        <CardHeader className="sticky top-0 bg-white z-10 border-b p-2.5 sm:p-3 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">
                Order Confirmation
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs truncate">
                Thank you for your purchase!
              </CardDescription>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {orderData && (
                <Badge
                  variant="outline"
                  className={`${getStatusColor(
                    orderData.orderStatus
                  )} flex gap-0.5 items-center px-1 py-0.5 text-[10px] sm:px-1.5 sm:py-0.5 sm:text-xs whitespace-nowrap`}
                >
                  {getStatusIcon(orderData.orderStatus)}
                  <span className="capitalize max-w-[50px] sm:max-w-none truncate">
                    {orderData.orderStatus}
                  </span>
                </Badge>
              )}
             
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-auto">
            <CardContent className="">
              {/* Loading state */}
              {loading && (
                <div className="p-3 sm:p-4 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-600">Loading order details...</p>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="p-3 sm:p-4 text-center text-red-500">
                  <p className="text-xs sm:text-sm">{error}</p>
                </div>
              )}

              {orderData && (
                <>
                  {/* Order Summary Cards - Stacked on mobile */}
                  <div className="grid grid-cols-1 gap-2 mb-3 sm:mb-4 sm:grid-cols-3 sm:gap-3">
                    <Card className="sm:col-span-3 bg-emerald-50 border-emerald-100 sm:hidden">
                      <CardHeader className="p-2 pb-1.5">
                        <CardTitle className="text-xs flex items-center">
                          <ShoppingBag className="mr-1 h-3 w-3 text-emerald-600" />
                          Order #{orderData.id.substring(0, 8)}...
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 pt-0">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Date:</span>
                            <span>
                              {new Date(
                                orderData.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total:</span>
                            <span className="font-medium">
                              ₹
                              {Number.parseFloat(orderData.totalAmount).toFixed(
                                2
                              )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="sm:col-span-1">
                      <CardContent className="p-2 sm:p-3">
                        <div className="flex items-start gap-2">
                          <div className="bg-emerald-50 p-1.5 rounded-full">
                            <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-xs sm:text-sm">Order Info</h3>
                            <div className="text-[10px] sm:text-xs mt-1 space-y-0.5">
                              <p className="text-gray-500 flex justify-between">
                                <span>Order ID:</span>
                                <span className="font-mono text-xs truncate ml-2 max-w-[80px]">
                                  {orderData.id.substring(0, 8)}...
                                </span>
                              </p>
                              <p className="text-gray-500 flex justify-between">
                                <span>Date:</span>
                                <span className="text-right">
                                  {new Date(
                                    orderData.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="sm:col-span-1">
                      <CardContent className="p-2 sm:p-3">
                        <div className="flex items-start gap-2">
                          <div className="bg-emerald-50 p-1.5 rounded-full">
                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-xs sm:text-sm">Payment</h3>
                            <div className="text-[10px] sm:text-xs mt-1 space-y-0.5">
                              <p className="text-gray-500 flex justify-between">
                                <span>Status:</span>
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(
                                    orderData.paymentStatus
                                  )}
                                >
                                  {orderData.paymentStatus}
                                </Badge>
                              </p>
                              <p className="text-gray-500 flex justify-between">
                                <span>Method:</span>
                                <span className="capitalize truncate ml-2 max-w-[80px]">
                                  {orderData.payments[0]?.paymentGateway ||
                                    "N/A"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="sm:col-span-1">
                      <CardContent className="p-2 sm:p-3">
                        <div className="flex items-start gap-2">
                          <div className="bg-emerald-50 p-1.5 rounded-full">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-xs sm:text-sm">Shipping</h3>
                            <div className="text-[10px] sm:text-xs mt-1 space-y-0.5 text-gray-500">
                              <p className="line-clamp-1">
                                {orderData.shippingAddress.street}
                              </p>
                              <p className="line-clamp-1">
                                {orderData.shippingAddress.city},{" "}
                                {orderData.shippingAddress.state}
                              </p>
                              <p className="line-clamp-1">
                                {orderData.shippingAddress.zipCode},{" "}
                                {orderData.shippingAddress.country}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Items */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center mb-2">
                      <Package className="mr-1 h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                      <h3 className="text-xs sm:text-sm font-medium">
                        Order Items
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {orderData.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 p-2 sm:p-2.5 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={
                                item.productVariant.ProductVariantImage.find(
                                  (img) => img.isPrimary
                                )?.imageUrl ||
                                "/placeholder.svg?height=80&width=80"
                              }
                              alt={item.productVariant.title}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <h4 className="font-medium text-[11px] sm:text-xs truncate">
                              {item.productVariant.product.name}
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">
                              {item.productVariant.title}
                            </p>
                            <div className="flex items-center mt-0.5 flex-wrap gap-0.5">
                              <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0">
                                Qty: {item.quantity}
                              </Badge>
                              {item.status && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getStatusColor(
                                    item.status
                                  )}`}
                                >
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right self-start pt-0.5">
                            <p className="font-medium text-[11px] sm:text-xs">
                              ₹{Number.parseFloat(item.priceAtPurchase).toFixed(2)}
                            </p>
                            {(Number.parseFloat(item.gstAmountAtPurchase) > 0 ||
                              Number.parseFloat(item.shippingCharge) > 0) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {Number.parseFloat(item.gstAmountAtPurchase) >
                                  0 && (
                                  <p>
                                    +₹
                                    {Number.parseFloat(
                                      item.gstAmountAtPurchase
                                    ).toFixed(2)}{" "}
                                    GST
                                  </p>
                                )}
                                {(() => {
                                  const shippingInfo = getShippingInfo();
                                  if (shippingInfo.isFreeDelivery) {
                                    return (
                                      <p className="text-green-600 text-xs">
                                        <span className="line-through text-gray-400">
                                          +₹{shippingInfo.originalShippingAmount.toFixed(2)} shipping
                                        </span>
                                        <span className="ml-1 font-semibold">FREE</span>
                                      </p>
                                    );
                                  } else if (Number.parseFloat(item.shippingCharge) > 0) {
                                    return (
                                      <p>
                                        +₹
                                        {Number.parseFloat(
                                          item.shippingCharge
                                        ).toFixed(2)}{" "}
                                        shipping
                                      </p>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Total */}
                  <Card className="mb-3 sm:mb-4 bg-gray-50 border-emerald-100">
                    <CardHeader className="p-2 pb-1.5">
                      <CardTitle className="text-xs sm:text-sm flex items-center">
                        <Truck className="mr-1 h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <div className="space-y-1 text-[11px] sm:text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subtotal:</span>
                          <span>
                            ₹
                            {orderData.items
                              .reduce(
                                (sum, item) =>
                                  sum +
                                  Number.parseFloat(item.priceAtPurchase) *
                                    item.quantity,
                                0
                              )
                              .toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">GST:</span>
                          <span>
                            ₹
                            {orderData.items
                              .reduce(
                                (sum, item) =>
                                  sum +
                                  Number.parseFloat(
                                    item.gstAmountAtPurchase || "0"
                                  ),
                                0
                              )
                              .toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Shipping:</span>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const shippingInfo = getShippingInfo();
                              if (shippingInfo.isFreeDelivery) {
                                return (
                                  <>
                                    <span className="text-gray-400 line-through text-xs">
                                      ₹{shippingInfo.originalShippingAmount.toFixed(2)}
                                    </span>
                                    <span className="text-green-600 font-semibold text-sm">
                                      FREE
                                    </span>
                                  </>
                                );
                              } else {
                                return (
                                  <span>
                                    ₹{shippingInfo.currentShippingAmount.toFixed(2)}
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span className="text-base sm:text-lg">
                            ₹
                            {Number.parseFloat(orderData.totalAmount).toFixed(
                              2
                            )}
                          </span>
                        </div>
                        
                        {/* Free Delivery Badge */}
                        {(() => {
                          const shippingInfo = getShippingInfo();
                          if (shippingInfo.isFreeDelivery) {
                            return (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600 text-sm font-semibold">
                                    🎉 Free Delivery Applied!
                                  </span>
                                </div>
                                <p className="text-green-600 text-xs mt-1">
                                  You saved ₹{shippingInfo.originalShippingAmount.toFixed(2)} on shipping
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transaction Details */}
                  {orderData.payments && orderData.payments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-2 text-gray-500">
                        Transaction Details
                      </h3>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="truncate">
                          Transaction ID:{" "}
                          <span className="font-mono">
                            {orderData.payments[0].transactionId}
                          </span>
                        </p>
                        <p className="truncate">
                          Order ID:{" "}
                          <span className="font-mono">
                            {orderData.payments[0].paymentGatewayOrderId}
                          </span>
                        </p>
                        <p>
                          Payment Date:{" "}
                          {formatDate(orderData.payments[0].paymentDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
        </div>

        <CardFooter className="sticky bottom-0 bg-gray-50 border-t border-gray-200 sm:rounded-b-lg p-2.5 sm:p-3">
          <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
            <Button
              variant="outline"
              onClick={() =>{
                setIsPaymentSuccess(false);
                setOrderId("");
                router.push('/');
              }}
              className="w-full sm:w-auto border-gray-300 hover:bg-gray-100 text-xs sm:text-sm h-8 sm:h-9"
            >
              Continue Shopping
            </Button>
            <Button 
              onClick={() =>{
                setIsPaymentSuccess(false);
                setOrderId("");
                router.push('/profile');
              }}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs sm:text-sm h-8 sm:h-9"
            >
              Track Order
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderConfirmationOverlay;
