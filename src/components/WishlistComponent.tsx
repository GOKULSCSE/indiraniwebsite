"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import axios from "axios"
import { ShoppingCart, Heart, ChevronLeft } from "lucide-react"
import WishlistLoader from "@/components/WishlistLoader "

interface WishlistItem {
  id: string
  productId: string
  productVariantId: string
  name: string
  image: string
  price: number
  rating?: number
  reviews?: number
  quantity: number
  isSelected: boolean
  variantInfo?: string
  productVariant?: {
    id: string
    variantType?: string
    variantValue?: string
    title?: string
    description?: string
    price: string
    ProductVariantImage?: {
      id: string
      imageUrl: string
      isPrimary: boolean
    }[]
    product?: {
      id: string
      name: string
      images: {
        id: string
        imageUrl: string
        isPrimary: boolean
      }[]
      variants: {
        id: string
        variantType: string
        variantValue: string
        title?: string
        description?: string
        ProductVariantImage?: {
          id: string
          imageUrl: string
          isPrimary: boolean
        }[]
      }[]
      reviews: {
        id: string
        rating: number
        reviewText: string | null
        createdAt: string
      }[]
    }
  }
}

interface SubmittedReview {
  rating: number
  text: string
  createdAt: string // ISO format
}

interface WishPageProps {
  onClose?: () => void;
}

export default function WishPage({ onClose }: WishPageProps) {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const [reviewsMap, setReviewsMap] = useState<Record<string, SubmittedReview[]>>({})
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Helper function to get variant-specific image
  const getVariantImage = (item: any) => {
    const product = item.productVariant?.product
    const productVariant = item.productVariant

    if (!product) return "/placeholder.png"

    // First try to get image from productVariant (if it has ProductVariantImage)
    if (productVariant?.ProductVariantImage?.length > 0) {
      const primaryImage = productVariant.ProductVariantImage.find((img: any) => img.isPrimary)
      return primaryImage?.imageUrl || productVariant.ProductVariantImage[0].imageUrl
    }

    // Fallback: find the variant in product.variants and get its image
    const variant = product.variants?.find((v: any) => v.id === item.productVariantId)
    if (variant?.ProductVariantImage?.length > 0) {
      const primaryImage = variant.ProductVariantImage.find((img: any) => img.isPrimary)
      return primaryImage?.imageUrl || variant.ProductVariantImage[0].imageUrl
    }

    // Final fallback: use product-level image
    const primaryProductImage = product.images?.find((img: any) => img.isPrimary)
    return primaryProductImage?.imageUrl || product.images?.[0]?.imageUrl || "/placeholder.png"
  }

  // Helper function to get variant details
  const getVariantDetails = (item: any) => {
    const product = item.productVariant?.product
    const productVariant = item.productVariant

    if (!product) return { title: "", variantInfo: "" }

    // Get variant details from productVariant or find in product.variants
    const variant = productVariant || product.variants?.find((v: any) => v.id === item.productVariantId)

    const title = variant?.title || product.name || "Unnamed Product"
    const variantInfo =
      variant?.variantType && variant?.variantValue ? `${variant.variantType}: ${variant.variantValue}` : ""

    return { title, variantInfo }
  }

  // Fetch wishlist
  useEffect(() => {
    const fetchWishlistData = async () => {
      if (!session?.user?.id) return

      try {
        const res = await axios.get(`/api/user/wishlist?userId=${session.user.id}`)

        // Check if data structure matches what you expect
        const items = res.data?.data?.items || []

        const formattedItems = items.map((item: any) => {
          const product = item.productVariant?.product
          const variantImage = getVariantImage(item)
          const { title, variantInfo } = getVariantDetails(item)

          // Calculate average rating and total reviews
          const productReviews = product?.reviews || []
          const avgRating =
            productReviews.length > 0
              ? (
                  productReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / productReviews.length
                ).toFixed(1)
              : 0
          const totalReviews = productReviews.length

          return {
            id: item.id,
            productId: product?.id || "",
            productVariantId: item.productVariant?.id || "",
            name: title,
            image: variantImage,
            price: Number(item.productVariant?.price) || 0,
            rating: avgRating,
            reviews: totalReviews,
            quantity: 1,
            isSelected: true,
            variantInfo: variantInfo,
            productVariant: item.productVariant, // Store the full productVariant for reference
          }
        })

        setCartItems(formattedItems)
      } catch (err) {
        console.error("Failed to fetch wishlist data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchWishlistData()
  }, [session?.user?.id])

  const handleHeartClick = async (wishlistItemId: string) => {
    try {
      await axios.delete("/api/user/wishlist", {
        data: { ids: [wishlistItemId] },
        headers: { "Content-Type": "application/json" },
      })

      setCartItems((prev) => prev.filter((item) => item.id !== wishlistItemId))
    } catch (error) {
      console.error("Error removing item:", axios.isAxiosError(error) ? error.response?.data : error)
    }
  }

  const handleAddToCart = async (item: WishlistItem) => {
    if (!session?.user?.id) {
      alert("Please log in to add products to your cart.")
      return
    }

    setIsAddingToCart(true)

    try {
      const response = await axios.post("/api/user/cart", {
        userId: session.user.id,
        items: [
          {
            productVariantId: item.productVariantId, // ✅ This is now reliable
            quantity: item.quantity,
          },
        ],
      })

      console.log("Cart Product:", response.data)
      // router.push("/cart")
    } catch (error: any) {
      console.error("Error posting product to cart:", error.response ? error.response.data : error)
      alert("There was an error adding the product to cart. Please try again.")
    } finally {
      setIsAddingToCart(false)
    }
  }

  if (loading) {
    return <WishlistLoader />
  }

  const handleProductClick = (id: string) => {
    router.push(`/product/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-3 py-3">
      <div className="flex items-center mb-3 sm:mb-4">
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full mr-2"
            aria-label="Close"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-center flex-1">Wishlist</h1>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 w-full p-1 sm:p-2 md:p-4">
          {cartItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-white p-2.5 sm:p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 relative"
            >
              <button 
                onClick={() => handleHeartClick(item.id)} 
                className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Heart
                  className="text-red-500 hover:text-gray-400 transition-colors cursor-pointer"
                  fill="currentColor"
                  size={16}
                />
              </button>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="w-full sm:w-[160px] md:w-[180px] h-28 sm:h-32 md:h-36 mx-auto flex items-center justify-center bg-gray-50 rounded-lg p-1.5 sm:p-2">
                  <img
                    onClick={() => handleProductClick(item.productId)}
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-contain rounded cursor-pointer hover:opacity-90 transition"
                  />
                </div>

                <div className="flex-1 space-y-1.5 sm:space-y-2">
                  <div>
                    <p
                      onClick={() => handleProductClick(item.productId)}
                      className="text-base sm:text-lg text-black font-bold cursor-pointer hover:text-blue-600 transition line-clamp-2"
                    >
                      {item.name}
                    </p>

                    {item.variantInfo && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-1">
                        {item.variantInfo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="bg-green-900 text-white px-2 py-0.5 rounded-full text-xs">
                      {item.rating} ★
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      ({item.reviews} review{item.reviews !== 1 ? "s" : ""})
                    </span>
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-gray-800 text-base sm:text-lg font-semibold">₹{item.price}</p>
                    <p
                      onClick={() => handleProductClick(item.productId)}
                      className="text-blue-600 hover:underline cursor-pointer text-xs sm:text-sm"
                    >
                      View Product Details
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={isAddingToCart}
                    className="bg-red-600 text-white w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg mt-1 sm:mt-2 flex items-center justify-center space-x-1.5 hover:bg-red-700 transition disabled:opacity-70 text-sm"
                  >
                    <ShoppingCart size={16} />
                    <span>{isAddingToCart ? "Adding..." : "Add to cart"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {cartItems.length === 0 && (
            <div className="col-span-full text-center py-6 sm:py-8 md:py-10 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500 text-base sm:text-lg mb-2 sm:mb-3">Your wishlist is empty.</p>
              <button
                onClick={() => router.push("/")}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
