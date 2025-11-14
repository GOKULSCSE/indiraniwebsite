  "use client"
import { useEffect, useState } from "react"
import type React from "react"

import Image from "next/image"
import {
  ChevronRight,
  ChevronLeft,
  Heart,
  Home,
  User,
  X,
  CheckCircle,
  Package,
  Truck,
  ClipboardCheck,
  Store,
  X as XIcon,
  AlertTriangle,
  Download,
} from "lucide-react"
import AddressForm from "@/components/address-form"
import ProfileForm from "@/components/profile-form"
import WishPage from "@/components/WishlistComponent"
import axios from "axios"
import { signOut, useSession } from "next-auth/react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"
import OrderProfileLoader from "@/components/OrderProfileLoader"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type OrderTracking = {
  id: string
  updatedAt: string
  remarks: string | null
  orderItemId: string
  status: string
}

type ProductVariantImage = {
  id: string
  productVariantId: string
  imageUrl: string
  isPrimary: boolean
  createdAt: string
}

type Discount = {
  id: string
  discountType: string
  discountValue: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  productVariantId: string
}

type Product = {
  id: string
  sellerId: string
  categoryId: string
  name: string
  description: string
  isApproved: boolean
  createdAt: string
  updatedAt: string
  aboutProduct: string
  productSKU: string
  images: any[]
}

type ProductVariant = {
  id: string
  productId: string
  variantType: string
  variantValue: string
  additionalPrice: string
  createdAt: string
  updatedAt: string
  description: string
  price: string
  stockQuantity: number
  title: string
  productVariantSKU: string
  hsnCode: string
  productWeight: string
  product: Product
  ProductVariantImage: ProductVariantImage[]
  discounts: Discount[]
}

type OrderItem = {
  id: string
  orderId: string
  sellerId: string
  quantity: number
  priceAtPurchase: string
  createdAt: string
  updatedAt: string
  userId: string
  productVariantId: string
  status: string
  discountAmountAtPurchase: string
  gstAmountAtPurchase: string
  courierServiceId: number
  shippingCharge: string
  shipmentId: string
  draftShipmentsId: string | null
  OrderTracking: OrderTracking[]
  productVariant: ProductVariant
  cancellationReason?: string
  invoiceStatus?: string
  adminInvoice?: string
  adminEway?: string
  sellerInvoice?: string
  sellerEway?: string
  seller?: {
    storeName: string
  }
  shipment?: {
    AWB: string
    shipmentStatus: string
  }
}

type Order = {
  paymentRefId: string
  orderRefId: string | null
  createdAt: string
  updatedAt: string
  paymentStatus: string
  shippingAddress: {
    id: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    phone: string | null
    email: string | null
    fullName: string | null
    landmark: string | null
  }
  items: OrderItem[]
}

interface AddressFormProps {
  onClose?: () => void
}

// Helper function to get variant-specific image
const getVariantImage = (orderItem: OrderItem) => {
  const productVariant = orderItem.productVariant

  if (!productVariant) return "/placeholder.svg"

  // Get image from ProductVariantImage array
  if (productVariant.ProductVariantImage?.length > 0) {
    const primaryImage = productVariant.ProductVariantImage.find((img) => img.isPrimary)
    return primaryImage?.imageUrl || productVariant.ProductVariantImage[0].imageUrl
  }

  return "/placeholder.svg"
}

// Helper function to get variant details
const getVariantDetails = (orderItem: OrderItem) => {
  const productVariant = orderItem.productVariant

  if (!productVariant) return { title: "", variantInfo: "" }

  const title = productVariant.title || productVariant.product?.name || "Unnamed Product"
  const variantInfo =
    productVariant.variantType && productVariant.variantValue
      ? `${productVariant.variantType}: ${productVariant.variantValue}`
      : ""

  return { title, variantInfo }
}

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "processing":
      return "bg-blue-100 text-blue-800"
    case "shipped":
      return "bg-purple-100 text-purple-800"
    case "delivered":
      return "bg-green-100 text-green-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Helper function to get timeline step color
const getTimelineStepColor = (key: string, isCompleted: boolean, isActive: boolean, currentStatus: string, stepIndex: number, currentIndex: number) => {
  if ((currentStatus === "cancellRequested" || currentStatus === "cancelled") && stepIndex < currentIndex) {
    return "bg-gray-100 border-gray-300"
  }
  switch (key) {
    case "pending":
      return isCompleted ? "bg-yellow-500 border-yellow-500" : isActive ? "bg-yellow-400 border-yellow-400" : "bg-yellow-100 border-yellow-300"
    case "processing":
      return isCompleted ? "bg-blue-500 border-blue-500" : isActive ? "bg-blue-400 border-blue-400" : "bg-blue-100 border-blue-300"
    case "shipped":
      return isCompleted ? "bg-purple-500 border-purple-500" : isActive ? "bg-purple-400 border-purple-400" : "bg-purple-100 border-purple-300"
    case "delivered":
      return isCompleted ? "bg-green-500 border-green-500" : isActive ? "bg-green-400 border-green-400" : "bg-green-100 border-green-300"
    case "cancellRequested":
      return isCompleted ? "bg-orange-500 border-orange-500" : isActive ? "bg-orange-400 border-orange-400" : "bg-orange-100 border-orange-300"
    case "cancelled":
      return isCompleted ? "bg-red-500 border-red-500" : isActive ? "bg-red-400 border-red-400" : "bg-red-100 border-red-300"
    default:
      return "bg-gray-100 border-gray-300"
  }
}

// Helper function to get status steps
const getStatusSteps = (currentStatus: string) => {
  const steps = [
    { key: "pending", label: "Order Placed", icon: ClipboardCheck },
    { key: "processing", label: "Processing", icon: Package },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: CheckCircle },
    { key: "cancellRequested", label: "Cancellation Requested", icon: AlertTriangle },
    { key: "cancelled", label: "Cancelled", icon: X },
  ]

  // Ensure statusOrder matches the keys and casing
  const statusOrder = ["pending", "processing", "shipped", "delivered", "cancellRequested", "cancelled"]
  const currentIndex = statusOrder.indexOf(currentStatus)

  return steps.map((step, index) => ({
    ...step,
    isCompleted: index <= currentIndex,
    isActive: index === currentIndex,
  }))
}

// Drawer Component
const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } overflow-y-auto`}
      >
        <div className="relative flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold mx-auto">{title}</h2>
          <button onClick={onClose} className="absolute right-4 p-2 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </>
  )
}

const OrderTrackingView = ({ orderItem, onBack }: { orderItem: OrderItem; onBack: () => void }) => {
  const router = useRouter()
  const statusSteps = getStatusSteps(orderItem.status)
  const currentIndex = statusSteps.findIndex(step => step.isActive)
  const visibleSteps = statusSteps.slice(0, currentIndex >= 0 ? currentIndex + 1 : 1)

  const handleProductClick = () => {
    const productId = orderItem.productVariant.productId
    if (productId) {
      router.push(`/product/${productId}`)
    }
  }

  const variantImage = getVariantImage(orderItem)
  const { title, variantInfo } = getVariantDetails(orderItem)

  // Calculate totals for this order item
  const subtotal = Number.parseFloat(orderItem.priceAtPurchase) * orderItem.quantity
  const discount = Number.parseFloat(orderItem.discountAmountAtPurchase)
  const gst = Number.parseFloat(orderItem.gstAmountAtPurchase)
  const shipping = Number.parseFloat(orderItem.shippingCharge)
  const total = subtotal - discount + gst + shipping

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div>
          <h2 className="text-xl font-semibold">Track Order</h2>
          <p className="text-sm text-gray-500">Order #{orderItem.orderId.substring(0, 8)}</p>
        </div>
      </div>

      {/* Order Status Badge */}
      <div className="flex justify-between items-center">
        <Badge className={`${getStatusColor(orderItem.status)} px-3 py-1 text-sm font-medium`}>
          {orderItem.status.charAt(0).toUpperCase() + orderItem.status.slice(1)}
        </Badge>
        <div className="text-right text-sm text-gray-500">
          <p>
            Placed on{" "}
            {new Date(orderItem.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Product Details Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div onClick={handleProductClick} className="flex-shrink-0 cursor-pointer">
              <Image
                src={variantImage || "/placeholder.svg"}
                alt="Product"
                width={80}
                height={80}
                className="rounded-lg object-cover border"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight">{title}</h3>
              {variantInfo && <p className="text-sm text-gray-600 mt-1">{variantInfo}</p>}
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{orderItem.productVariant.description}</p>
              <div className="flex justify-between items-center mt-3">
                <div>
                  <span className="text-lg font-bold">₹{total.toFixed(2)}</span>
                  <span className="text-sm text-gray-500 ml-2">Qty: {orderItem.quantity}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-6">
              {visibleSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.key} className="relative flex items-start">
                    {/* Timeline dot */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10 border-2 ${getTimelineStepColor(step.key, step.isCompleted, step.isActive, orderItem.status, index, currentIndex)} ${step.isActive ? 'ring-4 ring-offset-2 ring-blue-200 shadow-lg' : ''}`}
                    >
                      <Icon
                        className={`w-5 h-5 ${step.isCompleted || step.isActive ? "text-white" : "text-gray-400"}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="ml-4 pb-6">
                      <h4
                        className={`font-medium ${
                          step.isCompleted || step.isActive ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </h4>

                      {step.isActive && (
                        <p className="text-sm text-gray-600 mt-1">
                          {step.key === "pending" && "Your order has been placed successfully"}
                          {step.key === "processing" && "Your order is being prepared for shipment"}
                          {step.key === "shipped" && "Your order is on the way"}
                          {step.key === "delivered" && "Your order has been delivered"}
                          {step.key === "cancellRequested" && "Your cancellation request has been received and is being processed"}
                          {step.key === "cancelled" && "Your order has been cancelled"}
                        </p>
                      )}

                      {/* Show cancellation reason only for the current step if it's cancellRequested */}
                      {step.key === orderItem.status && step.key === "cancellRequested" && orderItem.cancellationReason
                        ? <p className="text-xs text-gray-500 mt-1">Reason: {orderItem.cancellationReason}</p>
                        : null}

                      {step.isCompleted && step.key === "pending" && (
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(orderItem.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipment Details */}
      {orderItem.shipmentId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Shipment ID:</span>
              <span className="font-medium">{orderItem.shipmentId.substring(0, 8)}</span>
            </div>
            {orderItem.shipment?.AWB && (
              <div className="flex justify-between">
                <span className="text-gray-600">AWB Number:</span>
                <span className="font-medium">{orderItem.shipment.AWB}</span>
              </div>
            )}
            {orderItem.courierServiceId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Courier Service:</span>
                <span className="font-medium">Service #{orderItem.courierServiceId}</span>
              </div>
            )}
            {orderItem.shipment?.shipmentStatus && (
              <div className="flex justify-between">
                <span className="text-gray-600">Shipment Status:</span>
                <span className="font-medium capitalize">{orderItem.shipment.shipmentStatus}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Subtotal ({orderItem.quantity} item{orderItem.quantity > 1 ? "s" : ""}):
            </span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">GST:</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Shipping:</span>
            <span>₹{shipping.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Download */}
      {orderItem.adminInvoice && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Invoice</CardTitle>
              <Button
                onClick={() => window.open(orderItem.adminInvoice, '_blank')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Tracking History */}
      {orderItem.OrderTracking && orderItem.OrderTracking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tracking History</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {orderItem.OrderTracking.map((tracking) => (
                <div key={tracking.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium capitalize">{tracking.status}</p>
                      {tracking.remarks && <p className="text-sm text-gray-600 mt-1">{tracking.remarks}</p>}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(tracking.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const OrderItemCard = ({ orderItem, fetchOrders }: { orderItem: OrderItem, fetchOrders: () => void }) => {
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const [cancelReasonType, setCancelReasonType] = useState("")
  const router = useRouter()

  const handleTrackClick = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/orders/${orderItem.id}/track`)

      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "success") {
        setSelectedOrderItem(data.data)
        setTrackingOpen(true)
      } else {
        console.error("Error fetching order:", data.message)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = () => {
    const productId = orderItem.productVariant.productId
    if (productId) {
      router.push(`/product/${productId}`)
    }
  }

  const commonReasons = [
    "Ordered by mistake",
    "Found a better price",
    "Delivery is too slow",
    "Item no longer needed",
    "Other"
  ]

  const handleCancelOrder = async () => {
    setCancelLoading(true)
    setCancelError("")
    try {
      const reasonToSend = cancelReasonType === "Other" ? cancelReason : cancelReasonType
      const res = await fetch(`/api/user/orders/${orderItem.id}/cancellRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reasonToSend }),
      })
      if (!res.ok) throw new Error("Failed to cancel order.")
      setCancelSuccess(true)
      fetchOrders()
      setTimeout(() => {
        setCancelDialogOpen(false)
        setCancelSuccess(false)
        setCancelReason("")
        setCancelReasonType("")
      }, 1500)
    } catch (err: any) {
      setCancelError(err.message || "Something went wrong.")
    } finally {
      setCancelLoading(false)
    }
  }

  if (!orderItem || !orderItem.productVariant) {
    return (
      <div className="border rounded-lg p-4 flex justify-between items-center">
        <OrderProfileLoader />
      </div>
    )
  }

  const variantImage = getVariantImage(orderItem)
  const { title, variantInfo } = getVariantDetails(orderItem)

  // Calculate totals for this order item
  const subtotal = Number.parseFloat(orderItem.priceAtPurchase) * orderItem.quantity
  const discount = Number.parseFloat(orderItem.discountAmountAtPurchase)
  const gst = Number.parseFloat(orderItem.gstAmountAtPurchase)
  const shipping = Number.parseFloat(orderItem.shippingCharge)
  const total = subtotal - discount + gst + shipping

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex gap-4 flex-1">
              <div onClick={handleProductClick} className="cursor-pointer flex-shrink-0">
                <Image
                  src={variantImage || "/placeholder.svg"}
                  alt="Product"
                  width={64}
                  height={64}
                  className="rounded-lg object-cover border"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`${getStatusColor(orderItem.status)} text-xs`}>
                    {orderItem.status.charAt(0).toUpperCase() + orderItem.status.slice(1)}
                  </Badge>
                </div>

                <h3 className="font-semibold text-sm leading-tight mb-1">{title}</h3>
                {variantInfo && <p className="text-xs text-gray-600 mb-2">{variantInfo}</p>}

                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
                    <span className="text-sm text-gray-500 ml-2">Qty: {orderItem.quantity}</span>
                  </div>
                </div>

                {/* Cancel Order Button */}
                {orderItem.status.toLowerCase() === "pending" || orderItem.status.toLowerCase() === "processing" ? (
                  <Button
                    variant="outline"
                    className="mt-2 text-xs border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700 px-3 py-1 h-auto min-h-0"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancel Order
                  </Button>
                ) : null}

                <p className="text-xs text-gray-500 mt-2">
                  Placed on{" "}
                  {new Date(orderItem.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {orderItem.shipment?.AWB && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">AWB:</span> {orderItem.shipment.AWB}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleTrackClick}
              disabled={loading}
              className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0"
              aria-label="Track order"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      <Sheet open={trackingOpen} onOpenChange={setTrackingOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <button onClick={() => setTrackingOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <SheetTitle>Order Tracking</SheetTitle>
            </div>
          </SheetHeader>
          {selectedOrderItem ? (
            <div className="h-full overflow-y-auto p-4">
              <OrderTrackingView orderItem={selectedOrderItem} onBack={() => setTrackingOpen(false)} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <p>Loading order details...</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          {cancelSuccess ? (
            <div className="text-green-600 font-medium py-4">Order cancellation requested!</div>
          ) : (
            <>
              <div className="mb-2">Please select a reason for cancellation:</div>
              <select
                className="w-full border rounded p-2 mb-2"
                value={cancelReasonType}
                onChange={e => {
                  setCancelReasonType(e.target.value)
                  if (e.target.value !== "Other") setCancelReason("")
                }}
                disabled={cancelLoading}
              >
                <option value="">Select a reason...</option>
                {commonReasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {cancelReasonType === "Other" && (
                <textarea
                  className="w-full border rounded p-2 min-h-[80px]"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Enter reason..."
                  disabled={cancelLoading}
                />
              )}
              {cancelError && <div className="text-red-600 mt-2">{cancelError}</div>}
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  disabled={
                    cancelLoading ||
                    !cancelReasonType ||
                    (cancelReasonType === "Other" && !cancelReason.trim())
                  }
                >
                  {cancelLoading ? "Cancelling..." : "OK"}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" disabled={cancelLoading}>Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

const OrderCard = ({ order, fetchOrders }: { order: Order, fetchOrders: () => void }) => {
  // Get AWB numbers from all items that have shipments
  const awbNumbers = order.items
    .filter(item => item.shipment?.AWB)
    .map(item => item.shipment!.AWB)
    .filter((awb, index, self) => self.indexOf(awb) === index) // Remove duplicates

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Order ID #{order.items[0].orderId}</CardTitle>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            {awbNumbers.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">AWB Numbers:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {awbNumbers.map((awb, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {awb}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Badge className={`${getStatusColor(order.paymentStatus)} px-3 py-1`}>
            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {order.items.map((item) => (
            <OrderItemCard key={item.id} orderItem={item} fetchOrders={fetchOrders} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Profile({ onClose }: AddressFormProps) {
  const [activeTab, setActiveTab] = useState("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerContent, setDrawerContent] = useState<React.ReactNode>(null)
  const [drawerTitle, setDrawerTitle] = useState("")
  const { data } = useSession()
  const router = useRouter()

  const handleSubmit = (formData: FormData) => {
    console.log("Form submitted")
    const data = Object.fromEntries(formData.entries())
    console.log(data)
    setDrawerOpen(false)
  }

  // Move fetchOrders above useEffect and handleCancelOrder
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/user/orders")
        if (res.data.status === "success") {
          setOrders(res.data.data)
        } else {
          console.error("Error fetching orders:", res.data.message)
        }
      } catch (error) {
        console.error("API Error:", error)
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchOrders()
  }, [])

  const openDrawer = (content: React.ReactNode, title: string) => {
    setDrawerContent(content)
    setDrawerTitle(title)
    setDrawerOpen(true)
  }

  const handleMobileNavClick = (tab: string) => {
    setActiveTab(tab)

    let content: React.ReactNode = <p className="text-gray-500">Invalid tab selected.</p>
    let title = "Unknown"

    if (tab === "orders") {
      title = "Orders"
      content = (
        <div>
          <div className="flex items-center mb-6">
            <button
              onClick={() => setDrawerOpen(false)}
              className="mr-2 p-2 rounded-full hover:bg-gray-100"
              // aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Orders</h1>
            </div>
          </div>

          {loading ? (
            <OrderProfileLoader />
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found.</p>
            </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <OrderCard key={order.paymentRefId} order={order} fetchOrders={fetchOrders} />
                    ))}
                  </div>
                )}
        </div>
      )
    } else if (tab === "wishlist") {
      title = "Wishlist"
      content = <WishPage onClose={() => setDrawerOpen(false)} />
    } else if (tab === "address") {
      title = "Address"
      content = <AddressForm onSubmit={handleSubmit} onClose={() => setDrawerOpen(false)} />
    } else if (tab === "profile") {
      title = "Profile"
      content = <ProfileForm onSubmit={handleSubmit} onClose={() => setDrawerOpen(false)} />
    }

    openDrawer(content, title)
  }

  const { data: session } = useSession()

  return (
    <div className="flex justify-center bg-white p-2">
      <div className="w-full bg-white border overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <Image
                  src={session.user.image || "/placeholder.svg"}
                  alt="Profile"
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{session?.user?.name || "Loading..."}</h1>
              <p className="text-gray-600 text-sm">{session?.user?.email || "Loading..."}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Mobile Navigation */}
          <div className="lg:hidden w-full">
            <div className="bg-gray-100 p-4">
              <div className="border-t border-dashed border-gray-300 my-3"></div>
              {/* <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="text-gray-600">Available Balance:</span>
                  <span className="font-medium ml-1">₹0</span>
                </div>
                <button className="bg-black text-white hover:bg-gray-800 rounded-md text-sm px-4 py-2">
                  Add Balance
                </button>
              </div> */}
            </div>

            {/* Mobile Navigation List */}
            <div className="w-full">
              <button
                onClick={() => handleMobileNavClick("orders")}
                className="flex items-center justify-between w-full p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-gray-700" />
                  <span className="font-medium text-gray-800">Orders</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => handleMobileNavClick("wishlist")}
                className="flex items-center justify-between w-full p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-gray-700" />
                  <span className="font-medium text-gray-800">Wishlist</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => handleMobileNavClick("address")}
                className="flex items-center justify-between w-full p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-gray-700" />
                  <span className="font-medium text-gray-800">Address</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => handleMobileNavClick("profile")}
                className="flex items-center justify-between w-full p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-700" />
                  <span className="font-medium text-gray-800">Profile</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  if (data?.user?.isSeller && data.user.isSellerApproved && data.user.sellerId) {
                    router.push("/seller")
                  } else {
                    router.push("/become-a-seller")
                  }
                }}
                className="flex items-center gap-3 p-4 hover:bg-gray-100 transition-colors w-full text-left"
              >
                <Store className="h-5 w-5 text-gray-700" />
                <span className="font-medium text-gray-800">
                  {data?.user?.isSeller && data.user.isSellerApproved && data.user.sellerId
                    ? "Seller Dashboard"
                    : "Become a Seller"}
                </span>
              </button>
            </div>

            {/* Logout Button */}
            <div className="border-t p-4 flex justify-center">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex justify-center items-center gap-3 p-10 hover:bg-gray-100 transition-colors border-t w-full"
              >
                <span className="font-medium text-red-500">Logout</span>
              </button>
            </div>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block w-full lg:w-1/3 border-r p-5">
            <nav className="flex flex-col lg:space-y-4">
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex items-center gap-3 p-4 ${
                  activeTab === "orders" ? "bg-gray-200 border-l-4 border-gray-400" : "hover:bg-gray-100"
                } transition-colors w-full text-left`}
              >
                <Home className="h-5 w-5 text-gray-700" />
                <span className="font-medium text-gray-800">Orders</span>
              </button>

              <button
                onClick={() => setActiveTab("wishlist")}
                className={`flex items-center gap-3 p-4 ${
                  activeTab === "wishlist" ? "bg-gray-200 border-l-4 border-gray-400" : "hover:bg-gray-100"
                } transition-colors w-full text-left`}
              >
                <Heart className="h-5 w-5 text-gray-700" />
                <span className="font-medium text-gray-800">Wishlist</span>
              </button>

              <button
                onClick={() => setActiveTab("address")}
                className={`flex items-center gap-3 p-4 ${
                  activeTab === "address" ? "bg-gray-200 border-l-4 border-gray-400" : "hover:bg-gray-100"
                } transition-colors w-full text-left`}
              >
                <Home className="h-5 w-5 text-gray-700" />
                <span className="font-medium text-gray-800">Address</span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-3 p-4 ${
                  activeTab === "profile" ? "bg-gray-200 border-l-4 border-gray-400" : "hover:bg-gray-100"
                } transition-colors w-full text-left`}
              >
                <User className="h-5 w-5 text-gray-700" />
                <span className="font-medium text-gray-800">Profile</span>
              </button>

              <button
                onClick={() => {
                  if (data?.user?.isSeller && data.user.isSellerApproved && data.user.sellerId) {
                    router.push("/seller")
                  } else {
                    router.push("/become-a-seller")
                  }
                }}
                className="flex items-center gap-3 p-4 hover:bg-gray-100 transition-colors w-full text-left"
              >
                <Store className="h-5 w-5 text-gray-700" />
                <span className="font-medium text-gray-800">
                  {data?.user?.isSeller && data.user.isSellerApproved && data.user.sellerId
                    ? "Seller Dashboard"
                    : "Become a Seller"}
                </span>
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex justify-center items-center gap-3 p-10 hover:bg-gray-100 transition-colors border-t w-full"
              >
                <span className="font-medium text-red-500">Logout</span>
              </button>
            </nav>
          </div>

          {/* Right Panel - Desktop Only */}
          <div className="hidden lg:block w-full px-40 py-4">
            {activeTab === "orders" && (
              <div>
                <h2 className="text-xl font-bold mb-4">Orders</h2>
                {loading ? (
                  <OrderProfileLoader />
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <OrderCard key={order.paymentRefId} order={order} fetchOrders={fetchOrders} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "address" && <AddressForm onSubmit={handleSubmit} />}
            {activeTab === "profile" && <ProfileForm onSubmit={handleSubmit} />}
            {activeTab === "wishlist" && <WishPage />}
          </div>
        </div>
      </div>

      {/* Drawer Component */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerTitle}>
        {drawerContent}
      </Drawer>
    </div>
  )
}
