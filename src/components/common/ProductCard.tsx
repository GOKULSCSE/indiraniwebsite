"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useWishlistStore } from "@/store/wishlistStore"
import { useCartStore } from "@/store/cartStore"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    aboutProduct?: any
    price: string
    stockQuantity: number
    variants: {
      id: string
      variantType: string
      title: string
      variantValue: string
      additionalPrice: string
      description: string
      stockQuantity: number
      price: number

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
    images: {
      id: string
      imageUrl: string
      isPrimary: boolean
    }[]
    discounts?: {
      discountType: string
      discountValue: string
      startDate: string
      endDate: string
    }[]
  }
  index: number
  className?: string
  smallCardVariant?: boolean
}

export default function ProductCard({ product, index, className, smallCardVariant = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [wishlistVariantId, setWishlistVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [preventNavigation, setPreventNavigation] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  const { checkInWishlist, addToWishlist, removeByVariantId, fetchWishlist, wishlist } = useWishlistStore()
  const { addToCart: addToCartStore } = useCartStore()
  const isMobile = useIsMobile()
  const cardRef = useRef<HTMLDivElement>(null)
  const preventNavigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const x = useMotionValue(0)
  const scale = useTransform(x, [-150, 0, 150], [0.8, 1, 0.8])
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5])
  const constraintsRef = useRef(null)

  // Check if product is in wishlist
  const [isInWishlist, setIsInWishlist] = useState(
    checkInWishlist(product.id) || product.variants?.some((v) => checkInWishlist(v.id)) || false
  )
  
  // Update isInWishlist state when wishlist changes
  useEffect(() => {
    const newIsInWishlist = 
      checkInWishlist(product.id) || 
      product.variants?.some((v) => checkInWishlist(v.id)) || 
      false
    
    setIsInWishlist(newIsInWishlist)
  }, [checkInWishlist, product.id, product.variants, wishlist])

  // Get selected variant details for cart
  const getSelectedCartVariant = () => {
    if (!selectedVariantId) return product.variants[0] || null
    return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0]
  }

  // Get selected variant details for wishlist
  const getSelectedWishlistVariant = () => {
    if (!wishlistVariantId) return product.variants[0] || null
    return product.variants.find((v) => v.id === wishlistVariantId) || product.variants[0]
  }

  const getCurrentPrice = () => {
    const now = new Date()
    const activeDiscount = product.discounts?.find((discount) => {
      const startDate = new Date(discount.startDate)
      const endDate = new Date(discount.endDate)
      return now >= startDate && now <= endDate
    })

    if (!activeDiscount) return Number.parseFloat(product.price)

    const basePrice = Number.parseFloat(product.price)
    if (activeDiscount.discountType === "percentage") {
      const discountAmount = basePrice * (Number.parseFloat(activeDiscount.discountValue) / 100)
      return basePrice - discountAmount
    } else {
      return basePrice - Number.parseFloat(activeDiscount.discountValue)
    }
  }

  const currentPrice = getCurrentPrice()
  const hasDiscount = currentPrice < Number.parseFloat(product.price)
  const discountPercentage = hasDiscount
    ? Math.round(((Number.parseFloat(product.price) - currentPrice) / Number.parseFloat(product.price)) * 100)
    : 0

  const handleImageNavigation = (direction: "prev" | "next", e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    const images = getAllProductImages()
    if (images.length <= 1) return
    
    if (direction === "prev") {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    } else {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x > threshold) {
      handleImageNavigation("prev")
    } else if (info.offset.x < -threshold) {
      handleImageNavigation("next")
    }
  }

  const handleClick = () => {
    if (preventNavigation) return
    router.push(`/product/${product.id}`)
  }

  const handleDirectWishlistToggle = async () => {
    if (!session?.user?.id) {
      toast.info("Please log in to add products to your wishlist")
      return
    }

    const productId = product.id
    
    try {
      setIsAddingToWishlist(true)

      if (checkInWishlist(productId)) {
        await removeByVariantId(productId)
        setIsInWishlist(false)
        toast.success("Removed from wishlist")
      } else {
        await addToWishlist(session.user.id, productId, {
          productId: product.id,
          title: product.name,
          price: product.price,
          imageUrl:
            product.images?.find((img) => img.isPrimary)?.imageUrl ||
            product.images?.[0]?.imageUrl,
        })
        setIsInWishlist(true)
        toast.success("Added to wishlist")
      }

      // Update the wishlist store
      await fetchWishlist(session.user.id, true)
    } catch (error) {
      toast.error("Failed to update wishlist")
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  const handleAddToWishlist = async () => {
    if (!session?.user?.id) {
      toast.info("Please log in to add products to your wishlist")
      return
    }

    const variantId = wishlistVariantId || product.variants[0]?.id || product.id
    const selectedVariant = getSelectedWishlistVariant()

    try {
      setIsAddingToWishlist(true)

      if (checkInWishlist(variantId)) {
        await removeByVariantId(variantId)
        setIsInWishlist(false)
        toast.success("Removed from wishlist")
      } else {
        await addToWishlist(session.user.id, variantId, {
          productId: product.id,
          title: product.name,
          price: selectedVariant?.price?.toString() || product.price,
          imageUrl:
            selectedVariant?.ProductVariantImage?.find((img) => img.isPrimary)?.imageUrl ||
            selectedVariant?.ProductVariantImage?.[0]?.imageUrl ||
            product.images?.find((img) => img.isPrimary)?.imageUrl ||
            product.images?.[0]?.imageUrl,
        })
        setIsInWishlist(true)
        toast.success("Added to wishlist")
      }

      setIsWishlistOpen(false)
      await fetchWishlist(session.user.id, true)
    } catch (error) {
      toast.error("Failed to update wishlist")
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  const handleAddToCart = async () => {
    if (!session?.user?.id) {
      toast.info("Please log in to add products to your cart")
      return
    }

    if (!selectedVariantId && product.variants?.length > 0) {
      toast.warning("Please select a product variant")
      return
    }

    setIsAddingToCart(true)

    try {
      const selectedVariant = getSelectedCartVariant()
      const variantId = selectedVariantId || product.id
      
      // Create cart item data
      const cartItem = {
        id: `temp-${Date.now()}`,
        productVariantId: variantId,
        productId: product.id,
        cartId: "", // Will be set by the store
        quantity: quantity,
        isSelected: false,
        productVariant: {
          id: variantId,
          productId: product.id,
          title: selectedVariant?.title || product.name,
          description: selectedVariant?.description || product.description,
          price: selectedVariant?.price?.toString() || product.price,
          stockQuantity: selectedVariant?.stockQuantity || product.stockQuantity,
          variantType: selectedVariant?.variantType || "",
          variantValue: selectedVariant?.variantValue || "",
          additionalPrice: selectedVariant?.additionalPrice || "0",
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            images: product.images,
            variants: product.variants,
            reviews: []
          }
        },
        image: selectedVariant?.ProductVariantImage?.find((img) => img.isPrimary)?.imageUrl ||
               selectedVariant?.ProductVariantImage?.[0]?.imageUrl ||
               product.images?.find((img) => img.isPrimary)?.imageUrl ||
               product.images?.[0]?.imageUrl,
        description: selectedVariant?.description || product.description,
        rating: 0,
        reviews: 0,
        price: selectedVariant?.price || Number.parseFloat(product.price),
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          images: product.images,
          variants: product.variants,
          reviews: [],
          quantity: (q: any) => q,
          sellerId: null
        }
      }

      // Use the cart store to add the item
      await addToCartStore(cartItem, session.user.id)
      
      toast.success("Added to cart successfully!")
      setIsCartOpen(false)
    } catch (error: any) {
      console.error("Error adding product to cart:", error)
      toast.error("There was an error adding the product to cart. Please try again.")
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Set default variant when sheets open
  useEffect(() => {
    if (isCartOpen && !selectedVariantId && product.variants?.length > 0) {
      setSelectedVariantId(product.variants[0].id)
    }
  }, [isCartOpen, selectedVariantId, product.variants])

  useEffect(() => {
    if (isWishlistOpen && !wishlistVariantId && product.variants?.length > 0) {
      setWishlistVariantId(product.variants[0].id)
    }
  }, [isWishlistOpen, wishlistVariantId, product.variants])

  // Helper to get all product images (from variants and main product)
  const getAllProductImages = () => {
    const allImages = [
      ...product.images.map(img => img.imageUrl),
      ...product.variants
        .flatMap(variant => 
          variant.ProductVariantImage?.map(img => img.imageUrl) || []
        )
    ].filter(Boolean)
    
    return allImages.length > 0 ? allImages : ["/placeholder.svg"]
  }

  const allImages = getAllProductImages()
  const isInStock = getSelectedCartVariant()?.stockQuantity > 0 || product.stockQuantity > 0

  // Auto slide images on mobile with better control
  useEffect(() => {
    let autoSlideTimeout: NodeJS.Timeout | null = null;
    
    const startAutoSlide = () => {
      if (!isMobile || allImages.length <= 1) return;
      
      // Clear any existing timeouts
      if (autoSlideTimeout) {
        clearTimeout(autoSlideTimeout);
      }
      
      // Schedule the next slide after 5 seconds
      autoSlideTimeout = setTimeout(() => {
        setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
        // Recursively call this function to schedule the next slide
        startAutoSlide();
      }, 5000);
    };
    
    // Start the auto slide if conditions are met
    if (isMobile && !isCartOpen && !isWishlistOpen && allImages.length > 1) {
      startAutoSlide();
    }
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (autoSlideTimeout) {
        clearTimeout(autoSlideTimeout);
      }
    };
  }, [isMobile, isCartOpen, isWishlistOpen, currentImageIndex, allImages.length]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (preventNavigationTimeoutRef.current) {
        clearTimeout(preventNavigationTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
              <motion.div
          ref={cardRef}
          className={cn(
            "group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-400 cursor-pointer flex flex-col h-full",
            "border border-gray-100 hover:border-gray-200",
            smallCardVariant ? "" : index == 0 ? "col-span-0 md:col-span-2" : "",
            smallCardVariant ? "md:col-span-1" : "",
            className,
          )}
          initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onClick={handleClick}
          whileHover={{ y: -5 }}
      >
        {/* Discount Badge */}
        {hasDiscount && (
          <motion.div
            initial={{ scale: 0, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: -12, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
            className="absolute top-3 left-3 z-10"
          >
            <Badge className={cn(
              "bg-[#B01116] text-white font-semibold px-2 py-1",
              smallCardVariant ? "text-[9px]" : "text-xs"
            )}>-{discountPercentage}%</Badge>
          </motion.div>
        )}

        {/* Wishlist Button */}
        <motion.button
          className={cn(
            "absolute top-3 right-3 z-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-300",
            smallCardVariant ? "p-1.5" : "p-2"
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation()
            
            // Direct toggle if the product has no variants
            if (product.variants?.length === 0) {
              handleDirectWishlistToggle()
            } else {
              // Open wishlist sheet if product has variants
              setIsWishlistOpen(true)
            }
          }}
        >
          <Heart
            size={smallCardVariant ? 14 : 18}
            className={cn(
              "transition-colors duration-200",
              isInWishlist ? "fill-[#B01116] text-[#B01116]" : "text-gray-600 hover:text-[#B01116]",
            )}
          />
        </motion.button>

        {/* Image Container */}
        <div className={cn(
          "relative w-full overflow-hidden bg-gray-50 flex-shrink-0",
          smallCardVariant ? "h-[140px] md:h-[160px]" : "md:h-[200px] h-[180px]"
        )}>
          <motion.div ref={constraintsRef} className="relative w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                drag="x"
                dragConstraints={constraintsRef}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ x, scale, opacity }}
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Image
                  src={allImages[currentImageIndex] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className={cn("w-full h-full object-contain transition-transform duration-500", "group-hover:scale-110")}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Desktop Image Navigation */}
            {allImages.length > 1 && !smallCardVariant && (
              <div className="hidden md:block">
                <AnimatePresence>
                  {isHovered && (
                    <>
                                                <motion.button
                            initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200"
                            onClick={(e) => handleImageNavigation("prev", e)}
                          >
                            <ChevronLeft size={16} />
                          </motion.button>
                          <motion.button
                            initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200"
                            onClick={(e) => handleImageNavigation("next", e)}
                      >
                        <ChevronRight size={16} />
                      </motion.button>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Image Indicators */}
            {allImages.length > 1 && (
              <div className="md:hidden absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {allImages.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      smallCardVariant ? "w-1 h-1" : "w-1.5 h-1.5",
                      index === currentImageIndex ? "bg-white" : "bg-white/50",
                    )}
                  />
                ))}
              </div>
            )}

            {/* Stock Status */}
            {!isInStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary" className={cn(
                  "bg-white text-gray-900",
                  smallCardVariant ? "text-[9px] px-1.5 py-0.5" : ""
                )}>
                  Out of Stock
                </Badge>
              </div>
            )}
          </motion.div>
        </div>

        {/* Product Info */}
        <div className={cn(
          "flex flex-col flex-grow justify-between",
          smallCardVariant ? "p-1.5" : "p-3 md:p-2"
        )}>
          <div className={cn(
            "space-y-1.5",
            smallCardVariant && "space-y-0.5"
          )}>
            {/* Product Name */}
            <h3 className={cn(
              "font-semibold text-gray-900 line-clamp-2 leading-tight",
              smallCardVariant ? "text-xs md:text-xs" : "md:text-sm text-xs"
            )}>{product.name}</h3>

            {/* Description */}
            {!smallCardVariant && (
              <p className="text-xs text-gray-600 line-clamp-3 min-h-[3em]">{product.description}</p>
            )}

            {/* Description for small variant - more compact */}
            {smallCardVariant && (
              <p className="text-[10px] text-gray-600 line-clamp-2 min-h-[2em]">{product.description}</p>
            )}

            {/* Variants Preview - Just show a few */}
            {product.variants?.length > 0 && !smallCardVariant && (
              <div className="flex flex-wrap gap-1">
                {product.variants.slice(0, 2).map((variant) => (
                  <button
                    key={variant.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedVariantId(variant.id)
                      setIsCartOpen(true)
                    }}
                    className={cn(
                      "px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs rounded-md border transition-all duration-200",
                      selectedVariantId === variant.id
                        ? "border-[#B01116] bg-red-50 text-[#B01116]"
                        : "border-gray-200 hover:border-gray-300",
                      variant.stockQuantity === 0 && "opacity-50 cursor-not-allowed",
                    )}
                    disabled={variant.stockQuantity === 0}
                  >
                    {variant.variantValue}
                  </button>
                ))}
                {product.variants.length > 2 && (
                  <span className="px-1.5 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs text-gray-500">+{product.variants.length - 2} more</span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-bold text-[#B01116]",
                smallCardVariant ? "text-xs md:text-sm" : "md:text-base text-sm"
              )}>
                ₹{product.variants?.length ? Math.min(...product.variants.map((v) => v.price)) : product.price}
              </span>
              {hasDiscount && (
                <span className={cn(
                  "text-gray-500 line-through",
                  smallCardVariant ? "text-[9px]" : "text-xs"
                )}>₹{Number.parseFloat(product.price).toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Desktop Add to Cart Button - Always visible now */}
          {!smallCardVariant && (
            <div className="hidden md:block mt-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCartOpen(true)
                }}
                disabled={!isInStock}
                className="w-full bg-[#B01116] hover:bg-[#8a0d11] text-white rounded-lg py-1 text-xs transition-all duration-200"
                size="sm"
              >
                <ShoppingCart size={12} className="mr-1" />
                Add to Cart
              </Button>
            </div>
          )}

          {/* Mobile Add to Cart - Always visible */}
          <div className={cn(
            smallCardVariant ? "mt-0.5" : "md:hidden mt-1.5"
          )}>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                setIsCartOpen(true)
              }}
              disabled={!isInStock}
              className={cn(
                "w-full bg-[#B01116] hover:bg-[#8a0d11] text-white rounded-lg transition-all duration-200",
                smallCardVariant ? "text-[10px] py-0.5" : "py-1 text-xs"
              )}
              size="sm"
            >
              <ShoppingCart size={smallCardVariant ? 10 : 12} className="mr-1" />
              Add
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Cart Sheet */}
      <Sheet 
        open={isCartOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Prevent navigation for a short period after closing the sheet
            setPreventNavigation(true)
            
            // Clear any existing timeout
            if (preventNavigationTimeoutRef.current) {
              clearTimeout(preventNavigationTimeoutRef.current)
            }
            
            // Reset the flag after a delay
            preventNavigationTimeoutRef.current = setTimeout(() => {
              setPreventNavigation(false)
            }, 300) // 300ms should be enough to prevent accidental navigation
          }
          setIsCartOpen(open)
        }}
      >
        <SheetContent 
          className="w-full sm:max-w-md pt-20 md:pt-40" 
          onClick={(e) => e.stopPropagation()}
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <ChevronLeft className="mr-2 h-5 w-5 cursor-pointer" onClick={() => setIsCartOpen(false)} />
              Your Cart
            </SheetTitle>
            <SheetDescription>Review your items before checkout</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-50">
                <Image
                  src={
                    getSelectedCartVariant()?.ProductVariantImage?.find((img) => img.isPrimary)?.imageUrl ||
                    getSelectedCartVariant()?.ProductVariantImage?.[0]?.imageUrl ||
                    product.images?.find((img) => img.isPrimary)?.imageUrl ||
                    product.images?.[0]?.imageUrl ||
                    "/placeholder.svg"
                  }
                  alt={product.name}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h4 className="font-semibold">
                  {product.name}
                  {getSelectedCartVariant() && ` - ${getSelectedCartVariant()?.title}`}
                </h4>
                <p className="text-sm text-gray-600">{getSelectedCartVariant()?.description || product.description}</p>
                <p className="text-red-600 font-bold mt-1">₹{getSelectedCartVariant()?.price || product.price}</p>
                {getSelectedCartVariant() && (
                  <p className="text-xs text-gray-500">
                    {getSelectedCartVariant()?.variantType}: {getSelectedCartVariant()?.variantValue}
                  </p>
                )}
                <p className={`text-xs mt-1 ${(getSelectedCartVariant()?.stockQuantity ?? 0) === 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {(getSelectedCartVariant()?.stockQuantity ?? 0) === 0 
                    ? 'Out of Stock' 
                    : `In Stock: ${getSelectedCartVariant()?.stockQuantity} available`}
                </p>
              </div>
            </div>

            {product.variants?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Available Variants</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-4 py-2 rounded-full border text-sm transition-all duration-200 cursor-pointer whitespace-nowrap
                        ${variant.stockQuantity === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                          selectedVariantId === variant.id
                            ? "border-[#B01116] bg-red-50 text-[#B01116]"
                            : "border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      disabled={variant.stockQuantity === 0}
                    >
                      {variant.variantType} {variant.variantValue}
                      {variant.stockQuantity === 0 && ' (Out of Stock)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center border rounded-md overflow-hidden">
                <button
                  className="px-3 py-1 text-lg font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1 || (getSelectedCartVariant()?.stockQuantity ?? 0) === 0}
                >
                  −
                </button>
                <span className="px-4 py-1">{quantity}</span>
                <button
                  className="px-3 py-1 text-lg font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    const currentVariant = getSelectedCartVariant()
                    if (currentVariant && quantity < currentVariant.stockQuantity) {
                      setQuantity((prev) => prev + 1)
                    } else if (currentVariant) {
                      toast.error(`Maximum quantity reached (${currentVariant.stockQuantity})`, {
                        description: "You cannot add more than available stock"
                      })
                    }
                  }}
                  disabled={
                    quantity >= (getSelectedCartVariant()?.stockQuantity ?? 0) || 
                    (getSelectedCartVariant()?.stockQuantity ?? 0) === 0
                  }
                >
                  +
                </button>
              </div>
            </div>

            <Button
              className="w-full mt-6"
              onClick={handleAddToCart}
              disabled={
                isAddingToCart || 
                (product.variants?.length > 0 && !selectedVariantId) ||
                (getSelectedCartVariant()?.stockQuantity ?? 0) === 0
              }
            >
              {isAddingToCart 
                ? "Adding..." 
                : (getSelectedCartVariant()?.stockQuantity ?? 0) === 0 
                  ? "Out of Stock"
                  : "Add to Cart"
              }
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Wishlist Sheet */}
      <Sheet 
        open={isWishlistOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Prevent navigation for a short period after closing the sheet
            setPreventNavigation(true)
            
            // Clear any existing timeout
            if (preventNavigationTimeoutRef.current) {
              clearTimeout(preventNavigationTimeoutRef.current)
            }
            
            // Reset the flag after a delay
            preventNavigationTimeoutRef.current = setTimeout(() => {
              setPreventNavigation(false)
            }, 300) // 300ms should be enough to prevent accidental navigation
          }
          setIsWishlistOpen(open)
        }}
      >
        <SheetContent 
          className="w-full sm:max-w-md pt-20 md:pt-40" 
          onClick={(e) => e.stopPropagation()}
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <ChevronLeft className="mr-2 h-5 w-5 cursor-pointer" onClick={() => setIsWishlistOpen(false)} />
              Add to Wishlist
            </SheetTitle>
            <SheetDescription>Select variant to add to your wishlist</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-50">
                <Image
                  src={
                    getSelectedWishlistVariant()?.ProductVariantImage?.find((img) => img.isPrimary)?.imageUrl ||
                    getSelectedWishlistVariant()?.ProductVariantImage?.[0]?.imageUrl ||
                    product.images?.find((img) => img.isPrimary)?.imageUrl ||
                    product.images?.[0]?.imageUrl ||
                    "/placeholder.svg"
                  }
                  alt={product.name}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h4 className="font-semibold">
                  {product.name}
                  {getSelectedWishlistVariant() && ` - ${getSelectedWishlistVariant()?.title}`}
                </h4>
                <p className="text-sm text-gray-600">
                  {getSelectedWishlistVariant()?.description || product.description}
                </p>
                <p className="text-red-600 font-bold mt-1">₹{getSelectedWishlistVariant()?.price || product.price}</p>
                {getSelectedWishlistVariant() && (
                  <p className="text-xs text-gray-500">
                    {getSelectedWishlistVariant()?.variantType}: {getSelectedWishlistVariant()?.variantValue}
                  </p>
                )}
              </div>
            </div>

            {product.variants?.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Available Variants</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isVariantInWishlist = checkInWishlist(variant.id);
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setWishlistVariantId(variant.id)}
                        className={`px-4 py-2 rounded-full border text-sm transition-all duration-200 cursor-pointer whitespace-nowrap
                          ${
                            wishlistVariantId === variant.id
                              ? "border-[#B01116] bg-red-50 text-[#B01116]"
                              : isVariantInWishlist
                              ? "border-[#B01116] bg-red-50/30 text-[#B01116]"
                              : "border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        disabled={isVariantInWishlist}
                      >
                        {variant.variantType} {variant.variantValue}
                        {isVariantInWishlist && ' (In Wishlist)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-gray-500">No variants available for this product.</p>
                {checkInWishlist(product.id) && (
                  <p className="mt-2 text-[#B01116] text-sm">This product is already in your wishlist</p>
                )}
              </div>
            )}

            <Button
              className="w-full mt-6"
              onClick={handleAddToWishlist}
              disabled={
                isAddingToWishlist || 
                (product.variants?.length > 0 && !wishlistVariantId) ||
                (wishlistVariantId && checkInWishlist(wishlistVariantId)) ||
                (!product.variants?.length && checkInWishlist(product.id))
              }
            >
              {isAddingToWishlist 
                ? "Adding..." 
                : (wishlistVariantId && checkInWishlist(wishlistVariantId)) || 
                  (!product.variants?.length && checkInWishlist(product.id))
                ? "Already in Wishlist"
                : "Add to Wishlist"
              }
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
