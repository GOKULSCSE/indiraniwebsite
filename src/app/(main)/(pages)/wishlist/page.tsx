"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import axios from "axios"
import { ShoppingCart, Heart, Loader2 } from "lucide-react"
import WishlistLoader from "@/components/WishlistLoader "
import { useWishlistStore } from "@/store/wishlistStore"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

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

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

interface SubmittedReview {
  rating: number
  text: string
  createdAt: string // ISO format
}

export default function WishPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const { data: session } = useSession()
  const [reviewsMap, setReviewsMap] = useState<Record<string, SubmittedReview[]>>({})
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { fetchWishlist } = useWishlistStore()
  const [removingItems, setRemovingItems] = useState<Record<string, boolean>>({})
  const isMobile = useIsMobile()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: isMobile ? 6 : 8,
    totalPages: 1,
    hasMore: false
  })

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

  // Update limit based on device
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      limit: isMobile ? 6 : 8
    }))
  }, [isMobile])

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && pagination.hasMore && !loadingMore && !loading) {
        loadMoreWishlistItems()
      }
    }

    observerRef.current = new IntersectionObserver(handleObserver, options)
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [pagination.hasMore, loadingMore, loading, cartItems.length])

  // Fetch wishlist with pagination
  const fetchWishlistData = async (page: number, isInitialLoad = false) => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    if (isInitialLoad) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      // First, make sure the wishlist store is up to date
      await fetchWishlist(session.user.id, true)
      
      // Then fetch the detailed wishlist with product information and pagination
      const res = await axios.get(
        `/api/user/wishlist?userId=${session.user.id}&page=${page}&limit=${pagination.limit}`
      )

      // Extract items and pagination info
      const items = res.data?.data?.items || []
      const paginationInfo = res.data?.data?.pagination || {
        total: 0,
        page: 1,
        limit: pagination.limit,
        totalPages: 0,
        hasMore: false
      }

      // Update pagination state
      setPagination(paginationInfo)

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

      // If loading more, append to existing items, otherwise replace
      if (isInitialLoad) {
        setCartItems(formattedItems)
      } else {
        setCartItems(prevItems => [...prevItems, ...formattedItems])
      }
    } catch (err) {
      console.error("Failed to fetch wishlist data:", err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchWishlistData(1, true)
  }, [session?.user?.id])

  // Load more function
  const loadMoreWishlistItems = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchWishlistData(pagination.page + 1)
    }
  }

  const handleHeartClick = async (wishlistItemId: string) => {
    // Set loading state for this specific item
    setRemovingItems(prev => ({ ...prev, [wishlistItemId]: true }))
    
    try {
      await axios.delete("/api/user/wishlist", {
        data: { ids: [wishlistItemId] },
        headers: { "Content-Type": "application/json" },
      })

      // Update the local state
      setCartItems((prev) => prev.filter((item) => item.id !== wishlistItemId))
      
      // Update the wishlist store to keep the global state in sync
      if (session?.user?.id) {
        await fetchWishlist(session.user.id, true)
      }
      
      toast.success("Item removed from wishlist")
    } catch (error) {
      console.error("Error removing item:", axios.isAxiosError(error) ? error.response?.data : error)
      toast.error("Failed to remove item from wishlist")
    } finally {
      // Clear loading state for this item
      setRemovingItems(prev => {
        const newState = { ...prev }
        delete newState[wishlistItemId]
        return newState
      })
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

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Wishlist</h1>
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full p-4 lg:p-6">
            {[...Array(isMobile ? 6 : 8)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow relative animate-pulse">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="w-[200px] h-32 bg-slate-200 rounded"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-8 bg-slate-200 rounded w-full mt-4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleProductClick = (id: string) => {
    router.push(`/product/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Wishlist</h1>

      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full p-4 lg:p-6">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow relative">
              <div className="absolute top-2 right-2">
                {removingItems[item.id] ? (
                  <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
                ) : (
                  <div 
                    onClick={() => handleHeartClick(item.id)}
                    className="cursor-pointer"
                  >
                    <Heart
                      className="text-red-500 hover:text-gray-400 transition-colors cursor-pointer"
                      fill="currentColor"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-[200px] h-32 mx-auto flex items-center justify-center">
                  <img
                    onClick={() => handleProductClick(item.productId)}
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-contain rounded cursor-pointer hover:opacity-90 transition"
                  />
                </div>

                <div className="flex-1">
                  <p
                    onClick={() => handleProductClick(item.productId)}
                    className="text-sm text-black font-bold cursor-pointer hover:text-blue-600 transition"
                  >
                    {item.name}
                  </p>

                  {/* Show variant information if available */}
                  {item.variantInfo && <p className="text-xs text-gray-600 mt-1">{item.variantInfo}</p>}

                  <div className="text-xs mt-1">
                    <span className="bg-green-900 text-white px-2 py-1 rounded">{item.rating} ★</span>
                    <span className="text-gray-500 ml-2">
                      ({item.reviews} review{item.reviews !== 1 ? "s" : ""})
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mt-2 font-semibold">₹{item.price}</p>
                  <p
                    onClick={() => handleProductClick(item.productId)}
                    className="font-light text-blue-600 hover:underline cursor-pointer"
                  >
                    Product Details
                  </p>

                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={isAddingToCart}
                    className="bg-red-600 text-white w-full py-2 rounded-lg mt-4 flex items-center justify-center space-x-2 hover:bg-red-700 transition disabled:opacity-70"
                  >
                    <ShoppingCart />
                    <span>{isAddingToCart ? "Adding..." : "Add to cart"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Display skeleton cards inline with products when loading more */}
          {loadingMore && 
            [...Array(isMobile ? 6 : 8)].map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white p-4 rounded-lg shadow relative animate-pulse">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="w-[200px] h-32 bg-slate-200 rounded"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-8 bg-slate-200 rounded w-full mt-4"></div>
                  </div>
                </div>
              </div>
            ))
          }

          {cartItems.length === 0 && !loading && (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500 text-lg">Your wishlist is empty.</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>

        {/* Load more trigger element */}
        {pagination.hasMore && !loadingMore && (
          <div ref={loadMoreRef} className="h-10 mt-4"></div>
        )}
        
        {/* End of results message */}
        {!pagination.hasMore && cartItems.length > 0 && (
          <div className="mt-8 text-center py-4 text-sm text-slate-500">
            End of results
          </div>
        )}
      </div>
    </div>
  )
}
