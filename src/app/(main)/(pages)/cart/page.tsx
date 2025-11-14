"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/store/cartStore"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useSession } from "next-auth/react"
import _ from "lodash"
import CartLoader from "@/components/CartLoader"
import { Star } from "lucide-react"
import { CircularSpinner } from "@/components/CircularSpinner"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string
  price: string
  aboutProduct?: any
  stockQuantity?: number
  GST?: {
    id: string
    percentage: string
    createdAt: string
    updatedAt: string
    productId: string
  }
  variants?: {
    id: string
    variantType: string
    variantValue: string
    additionalPrice: string
    price: string
    title?: string
    description?: string
    stockQuantity?: number

    ProductVariantImage?: {
      id: string
      imageUrl: string
      isPrimary: boolean
    }[]
    discounts?: {
      id: string
      discountType: string
      discountValue: number
      startDate: string
      endDate: string
    }[]
  }[]
  images?: {
    id: string
    imageUrl: string
    isPrimary: boolean
  }[]
  reviews?: {
    id: string
    rating: number
    reviewText: string | null
    createdAt: string
  }[]
}

interface CartItem {
  id: string
  productVariantId: string
  quantity: number
  productVariant: {
    id: string
    productId: string
    price: string
    variantType?: string
    variantValue?: string
    title?: string
    description?: string
    stockQuantity?: number
    ProductVariantImage?: {
      id: string
      imageUrl: string
      isPrimary: boolean
    }[]
    product?: Product
  }
}

export default function CartPage() {
  const { cartId, setCartId, setCartItems, cartItems, updateQuantity, removeItem, checkout } = useCartStore()
  const router = useRouter()
  
  // Ensure cartItems is always an array
  const safeCartItems = Array.isArray(cartItems) ? cartItems : []

  const { data, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [showGstBreakdown, setShowGstBreakdown] = useState(false)

  const [isClient, setIsClient] = useState(false)
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({})
  const [quantityLoading, setQuantityLoading] = useState<Record<string, 'increase' | 'decrease' | null>>({})

  useEffect(() => {
    setIsClient(true)
  }, [])

  const fetchCartData = async () => {
    try {
      const response = await axios.get("/api/user/cart", {
        params: { userId: data?.user?.id },
      })
      const cartData = response.data.data

      if (!_.isEmpty(response.data.data)) {
        setCartId(cartData.id)
        setCartItems(cartData.items)
      }
    } catch (error) {
      console.error("Failed to fetch cart data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (itemId: string, newQuantity: number, direction: 'increase' | 'decrease') => {
    try {
      const item = safeCartItems.find((item) => item.id === itemId);
      if (!item) return;

      if (newQuantity > item.productVariant.stockQuantity) {
        toast.error(`Maximum quantity reached (${item.productVariant.stockQuantity})`, {
          description: "You cannot add more than available stock",
          position: "top-center",
        });
        return;
      }

      if (newQuantity < 1) return;

      // Set loading state for this specific item and direction
      setQuantityLoading(prev => ({ ...prev, [itemId]: direction }));

      const response = await axios.put(`/api/user/cart`, {
        id: itemId,
        cartId: cartId,
        quantity: newQuantity,
        productVariantId: item.productVariantId,
      });

      if (response.data.status === "success") {
        // Fetch fresh cart data to ensure state consistency
        await fetchCartData();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    } finally {
      // Clear loading state
      setQuantityLoading(prev => ({ ...prev, [itemId]: null }));
    }
  };

  useEffect(() => {
    if (status === "authenticated" && data?.user?.id) {
      fetchCartData()
    }
  }, [setCartId, setCartItems, data, status])

  // Helper function to get variant-specific image
  const getVariantImage = (item: any) => {
    const product = item.productVariant?.product
    if (!product) return "/placeholder.png"

    // First try to get image from productVariant (if it has ProductVariantImage)
    if (item.productVariant?.ProductVariantImage?.length && item.productVariant.ProductVariantImage.length > 0) {
      const primaryImage = item.productVariant.ProductVariantImage.find((img: any) => img.isPrimary)
      return primaryImage?.imageUrl || item.productVariant.ProductVariantImage[0].imageUrl
    }

    // Fallback: find the variant in product.variants and get its image
    const variant = product.variants?.find((v: any) => v.id === item.productVariantId)
    if (variant?.ProductVariantImage?.length && variant.ProductVariantImage.length > 0) {
      const primaryImage = variant.ProductVariantImage.find((img: any) => img.isPrimary)
      return primaryImage?.imageUrl || variant.ProductVariantImage[0].imageUrl
    }

    // Final fallback: use product-level image
    const primaryProductImage = product.images?.find((img: any) => img.isPrimary)
    return primaryProductImage?.imageUrl || product.images?.[0]?.imageUrl || "/placeholder.png"
  }

  // Helper function to get variant details
  const getVariantDetails = (item: CartItem) => {
    const product = item.productVariant?.product
    if (!product) return { title: "", description: "", variantInfo: "" }

    // Get variant details from productVariant or find in product.variants
    const variant =
      item.productVariant || product.variants?.find((v) => v.id === item.productVariantId) || product.variants?.[0]

    const title = variant?.title || product.name
    const description = variant?.description || product.description
    const variantInfo =
      variant?.variantType && variant?.variantValue ? `${variant.variantType}: ${variant.variantValue}` : ""

    return { title, description, variantInfo }
  }

  const subtotal = safeCartItems.reduce((sum, item) => {
    if (!item?.productVariant?.price) return sum
    return sum + Number(item.productVariant.price) * item.quantity
  }, 0)

  const getAverageRating = (product: Product) => {
    if (!product.reviews || product.reviews.length === 0) return "N/A"

    const validReviews = product.reviews.filter((review) => review.rating)
    if (validReviews.length === 0) return "N/A"

    const avgRating = validReviews.reduce((sum, review) => sum + review.rating, 0) / validReviews.length
    return avgRating.toFixed(1)
  }

  // Calculate GST for each item and total GST
  const calculateGST = () => {
    let totalGST = 0
    const gstBreakdown = safeCartItems.map((item) => {
      const itemPrice = Number(item.productVariant?.price) * item.quantity
      const gstPercentage = Number(item.productVariant?.product?.GST?.percentage) || 0
      const itemGST = (itemPrice * gstPercentage) / 100
      totalGST += itemGST

      return {
        id: item.id,
        name: item.productVariant?.product?.name,
        quantity: item.quantity,
        gstPercentage,
        itemGST,
      }
    })

    return { totalGST, gstBreakdown }
  }

  const { totalGST, gstBreakdown } = calculateGST()
  const totalAmount = subtotal + totalGST
  const discountFee = 0.0

  const handleContinueShopping = () => {
    router.push("/")
  }

  const handleProductClick = (id: string) => {
    router.push(`/product/${id}`)
  }

  const handleCheckout = () => {
    checkout()
    router.push("/checkout")
  }

  if (!isClient || loading) {
    return <CartLoader />
  }

  // Show login prompt if user is not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen p-4">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="relative z-10 bg-amber-800">
              <img
                src="/assets/images/Landingpage/emptycart.jpg"
                alt="Please Login"
                className="w-[400px] h-[400px] object-contain"
              />
            </div>
            <button
              onClick={() => router.push("/auth/signin")}
              className="relative z-20 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg"
            >
              Please Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Shopping Cart Table (Visible only on larger) */}
          <div className="col-span-3 bg-white p-4 rounded-lg shadow hidden lg:block">
            {safeCartItems.length > 0 ? (
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-xs text-center">
                    <th className="p-2 w-2/12">{safeCartItems.length} items</th>
                    <th className="p-2 w-3/12">Details</th>
                    <th className="p-2 w-2/12">Quantity</th>
                    <th className="p-2 w-2/12">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {safeCartItems.map((item) => {
                    const product = item.productVariant?.product
                    if (!product) return null

                    const productId = product.id
                    const variantImage = getVariantImage(item)
                    const { title, description, variantInfo } = getVariantDetails(item)

                    return (
                      <tr key={item.id} className="border-t h-32 text-center">
                        <td className="p-2">
                          <img
                            onClick={() => handleProductClick(productId)}
                            src={variantImage || "/placeholder.svg"}
                            alt={title}
                            className="w-24 h-24 object-contain mx-auto cursor-pointer"
                          />
                        </td>
                        <td className="p-2 text-sm">
                          <p
                            className="font-bold text-black cursor-pointer"
                            onClick={() => handleProductClick(productId)}
                          >
                            {title}
                          </p>
                          {variantInfo && <p className="text-xs text-gray-600 mt-1">{variantInfo}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-white bg-green-900 flex items-center gap-1 px-2 py-1 rounded">
                              <Star className="w-3 h-3 fill-white" />
                              {getAverageRating(product)}
                            </span>
                            <span className="text-gray-500 text-sm">{description}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1, 'decrease')}
                              disabled={item.quantity <= 1 || item.productVariant.stockQuantity === 0 || quantityLoading[item.id] === 'decrease'}
                              className="px-2 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[32px] min-h-[32px]"
                            >
                              {quantityLoading[item.id] === 'decrease' ? (
                                <CircularSpinner size={16} />
                              ) : (
                                '-'
                              )}
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1, 'increase')}
                              disabled={item.quantity >= item.productVariant.stockQuantity || item.productVariant.stockQuantity === 0 || quantityLoading[item.id] === 'increase'}
                              className="px-2 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[32px] min-h-[32px]"
                            >
                              {quantityLoading[item.id] === 'increase' ? (
                                <CircularSpinner size={16} />
                              ) : (
                                '+'
                              )}
                            </button>
                            {item.productVariant.stockQuantity === 0 && (
                              <span className="text-red-500 text-sm">Out of Stock</span>
                            )}
                            {item.quantity >= item.productVariant.stockQuantity && item.productVariant.stockQuantity > 0 && (
                              <span className="text-red-500 text-sm">Maximum quantity reached</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 font-bold">
                          ₹ {Number(item.productVariant?.price).toFixed(2)}
                          <p
                            className="text-blue-600 hover:underline cursor-pointer text-xs"
                            onClick={() => handleProductClick(productId)}
                          >
                            Product Details
                          </p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 bg-red-100 px-2 py-1 rounded mt-1 text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">Your cart is empty.</p>
                <button
                  onClick={handleContinueShopping}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Shopping Cart Cards (Visible only on small) */}
          <div className="lg:hidden space-y-4">
            {safeCartItems.length > 0 ? (
              safeCartItems.map((item) => {
                const product = item.productVariant?.product
                if (!product) return null

                const productId = product.id
                const variantImage = getVariantImage(item)
                const { title, description, variantInfo } = getVariantDetails(item)

                return (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex gap-4">
                      <img
                        onClick={() => handleProductClick(productId)}
                        src={variantImage || "/placeholder.svg"}
                        alt={title}
                        className="w-20 h-20 object-contain cursor-pointer"
                      />
                      <div className="flex-1">
                        <p onClick={() => handleProductClick(productId)} className="text-sm text-black font-bold">
                          {title}
                        </p>
                        {variantInfo && <p className="text-xs text-gray-600 mt-1">{variantInfo}</p>}
                        <span className="text-white bg-green-900 flex items-center gap-1 px-2 py-1 rounded w-fit">
                          <Star className="w-3 h-3 text-white fill-white" />
                          {getAverageRating(product)}
                        </span>

                        <p className="text-gray-500 text-xs">{description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1, 'decrease')}
                              disabled={item.quantity <= 1 || item.productVariant.stockQuantity === 0 || quantityLoading[item.id] === 'decrease'}
                              className="px-2 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[32px] min-h-[32px]"
                            >
                              {quantityLoading[item.id] === 'decrease' ? (
                                <CircularSpinner size={16} />
                              ) : (
                                '-'
                              )}
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1, 'increase')}
                              disabled={item.quantity >= item.productVariant.stockQuantity || item.productVariant.stockQuantity === 0 || quantityLoading[item.id] === 'increase'}
                              className="px-2 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[32px] min-h-[32px]"
                            >
                              {quantityLoading[item.id] === 'increase' ? (
                                <CircularSpinner size={16} />
                              ) : (
                                '+'
                              )}
                            </button>
                            {item.productVariant.stockQuantity === 0 && (
                              <span className="text-red-500 text-sm">Out of Stock</span>
                            )}
                            {item.quantity >= item.productVariant.stockQuantity && item.productVariant.stockQuantity > 0 && (
                              <span className="text-red-500 text-sm">Maximum quantity reached</span>
                            )}
                          </div>
                          <p className="font-bold text-lg">₹ {Number(item.productVariant?.price).toFixed(2)}</p>
                        </div>
                        <p
                          onClick={() => handleProductClick(productId)}
                          className="font-light text-blue-600 hover:underline cursor-pointer"
                        >
                          Product Details
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 bg-red-100 px-2 py-1 rounded mt-1 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <p className="text-gray-500 text-lg">Your cart is empty.</p>
                <button
                  onClick={handleContinueShopping}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white p-4 rounded-lg shadow w-full">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="mb-2 flex justify-between">
                <p className="text-gray-700">Subtotal</p>
                <p className="text-gray-700">₹{subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <p>GST</p>
                  <button
                    className="text-blue-500 text-sm hover:text-blue-700"
                    onClick={() => setShowGstBreakdown(!showGstBreakdown)}
                  >
                    {showGstBreakdown ? "Hide Details" : "View Details"}
                  </button>
                </div>
                <p className="text-gray-700">₹{calculateGST().totalGST.toFixed(2)}</p>
              </div>


              {showGstBreakdown && (
                <div className="mb-4 text-sm">
                  {calculateGST().gstBreakdown.map((item) => (
                    <div key={item.id} className="flex justify-between text-gray-600 mb-1">
                      <span>{item.name} (×{item.quantity})</span>
                      <span>{item.gstPercentage}% - ₹{item.itemGST.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <hr className="my-4" />
              <div className="flex justify-between">
                <p className="text-lg font-bold">Total</p>
                <div className="">
                  <p className="mb-1 text-lg font-bold">₹{(subtotal + calculateGST().totalGST).toFixed(2)}</p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                disabled={safeCartItems.length === 0}
              >
                Proceed to Checkout
              </button>
              
              {/* Back to Shopping Button - Below Order Summary */}
              <button
                onClick={handleContinueShopping}
                className="w-full mt-3 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
