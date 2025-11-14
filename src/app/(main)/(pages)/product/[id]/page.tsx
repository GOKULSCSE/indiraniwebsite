"use client";

export const dynamic = 'force-dynamic';
// export const revalidate = 0;
export const fetchCache = 'force-no-store';


import { useState, useEffect } from "react";
import { ShoppingCart, Star, User } from "lucide-react";
import { Truck, BadgeCheck, RotateCcw, Headset, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import ProductEditor from "@/components/common/ProductEditor";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import ProductDetailPageLoader from "@/components/ProductDetailPageLoader";
import { useCartStore } from "@/store/cartStore";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Rating } from "primereact/rating";
import { Button } from "@/components/ui/button";
import moment from "moment";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import ProductCard from "@/components/common/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/common/Breadcrumb";
import dynamicImport from "next/dynamic";

const RazorpayAffordabilityWidget = dynamicImport(
  () => import("@/components/common/Payment/RazorpayAffordabilityWidget"),
  { ssr: false }
);

interface SubmittedReview {
  rating: number;
  reviewText: string;
  createdAt: string;
  user?: {
    name: string;
    profile?: string;
  };
}

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  aboutProduct: any;
  price: string;
  stockQuantity: number;
  hsnCode?: string;
  categoryId: string;
  sellerId: string;
  category?: {
    id: string;
    name: string;
    description?: string;
    parentCategoryId?: string;
    parentCategory?: {
      id: string;
      name: string;
      description?: string;
    } | null;
  };
  GST?: {
    id: string;
    percentage: number;
    createdAt: string;
    updatedAt: string;
  };
  variants: {
    id: string;
    variantType: string;
    title: string;
    variantValue: string;
    additionalPrice: string;
    description: string;
    stockQuantity: number;
    price: number;
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
  }[];
  images: {
    id: string;
    imageUrl: string;
    isPrimary: boolean;
  }[];
  discounts: {
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
  }[];
  seller?: {
    id: string;
    storeName: string;
    storeDescription: string;
  };
  linkName?: string;
  relatedProducts?: Array<{
    linkName: string;
    url: string;
  }>;
  reviews?: any[];
}

const ProductPage = ({ params }: { params: { id: string } }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const router = useRouter();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const { data: session } = useSession();
  const { addToCart } = useCartStore();
  const [rating, setRating] = useState<number | undefined>(undefined);

  const [reviewText, setReviewText] = useState("");

  const [reviews, setReviews] = useState<SubmittedReview[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingDistribution, setRatingDistribution] = useState<
    { star: number; percent: number }[]
  >([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSimilarProducts, setLoadingSimilarProducts] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [cartitems, setCartItems] = useState<
    Array<{
      id: string;
      productId: string;
      name: string;
      quantity: number;
      price: number;
      image?: string;
    }>
  >([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${params.id}`);
        if (response.data.status === "success") {
          const productData = response.data.data;
          setProduct(productData);

          // Set first variant as selected by default
          if (productData.variants?.length > 0) {
            const firstVariant = productData.variants[0];
            setSelectedVariant(firstVariant.id);

            // Set main image from first variant's images
            if (firstVariant.ProductVariantImage?.length > 0) {
              const primaryImage = firstVariant.ProductVariantImage.find(
                (img: any) => img.isPrimary
              );
              setMainImage(
                primaryImage?.imageUrl ||
                  firstVariant.ProductVariantImage[0].imageUrl
              );
            } else if (productData.images?.length > 0) {
              // Fallback to product images if variant has no images
              const primaryImage = productData.images.find(
                (img: any) => img.isPrimary
              );
              setMainImage(
                primaryImage?.imageUrl || productData.images[0].imageUrl
              );
            }
          } else if (productData.images?.length > 0) {
            // If no variants, use product images
            const primaryImage = productData.images.find(
              (img: any) => img.isPrimary
            );
            setMainImage(
              primaryImage?.imageUrl || productData.images[0].imageUrl
            );
          }
        }
      } catch (err) {
        setError("Failed to fetch product details");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  // Update main image when variant changes
  useEffect(() => {
    if (selectedVariant && product) {
      const variant = product.variants.find((v) => v.id === selectedVariant);
      if (variant && variant.ProductVariantImage && variant.ProductVariantImage.length > 0) {
        const primaryImage = variant.ProductVariantImage.find(
          (img) => img.isPrimary
        );
        setMainImage(
          primaryImage?.imageUrl || variant.ProductVariantImage[0].imageUrl
        );
      }
    }
  }, [selectedVariant, product]);

  // Get current variant images for thumbnail display
  const getCurrentVariantImages = () => {
    if (!selectedVariant || !product) return [];
    const variant = product.variants.find((v) => v.id === selectedVariant);
    return variant?.ProductVariantImage || [];
  };

  // Get current variant details
  const getCurrentVariant = () => {
    if (!selectedVariant || !product) return product?.variants[0] || null;
    return (
      product.variants.find((v) => v.id === selectedVariant) ||
      product.variants[0]
    );
  };

  // Get variant discounts and apply them
  const getVariantDiscounts = () => {
    const currentVariant = getCurrentVariant();
    if (!currentVariant || !currentVariant.discounts) return [];
    
    // Filter discounts that are valid today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return currentVariant.discounts.filter((discount: any) => {
      const start = new Date(discount.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(discount.endDate);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (basePrice: number, discounts: any[]) => {
    if (!discounts || discounts.length === 0) return basePrice;
    
    // Use the first active discount
    const discount = discounts[0];
    let discountedPrice = basePrice;
    
    if (discount.discountType === "percentage") {
      const discountAmount = (basePrice * Number(discount.discountValue)) / 100;
      discountedPrice = basePrice - discountAmount;
    } else {
      discountedPrice = basePrice - Number(discount.discountValue);
    }
    
    return discountedPrice;
  };

  // const [commands] = useState([
  //   {
  //     id: 1,
  //     quote:
  //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  //     name: "SMITH",
  //     position: "Manager of ABC Tech",
  //     image:
  //       "https://tse3.mm.bing.net/th?id=OIP.FkHSeCeIc0AJfe_7u6TnugHaEJ&pid=Api&P=0&h=180",
  //   },
  //   {
  //     id: 2,
  //     quote:
  //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  //     name: "SMITH",
  //     position: "Manager of ABC Tech",
  //     image:
  //       "https://tse3.mm.bing.net/th?id=OIP.FkHSeCeIc0AJfe_7u6TnugHaEJ&pid=Api&P=0&h=180",
  //   },
  //   {
  //     id: 3,
  //     quote:
  //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  //     name: "SMITH",
  //     position: "Manager of ABC Tech",
  //     image:
  //       "https://tse3.mm.bing.net/th?id=OIP.FkHSeCeIc0AJfe_7u6TnugHaEJ&pid=Api&P=0&h=180",
  //   },
  //   {
  //     id: 4,
  //     quote:
  //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  //     name: "SMITH",
  //     position: "Manager of ABC Tech",
  //     image:
  //       "https://tse3.mm.bing.net/th?id=OIP.FkHSeCeIc0AJfe_7u6TnugHaEJ&pid=Api&P=0&h=180",
  //   },
  // ]);

  const handleWishlist = async () => {
    if (!session?.user?.id) return;

    try {
      await axios.post("/api/user/wishlist", {
        userId: session.user.id,
        items: [
          {
            productId: product?.id || "",
            quantity: 1,
          },
        ],
      });

      router.push("/wishlist");
    } catch (error) {
      console.error(
        "Failed to add to wishlist:",
        axios.isAxiosError(error) ? error.response?.data : error
      );
    }
  };

  const handleAddToCart = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to add products to your cart.");
      return;
    }

    if (!selectedVariant || !product) {
      toast.error("Please select a product variant.");
      return;
    }

    setIsAddingToCart(true);

    try {
      const currentVariant = product.variants.find((v) => v.id === selectedVariant);
      if (!currentVariant) {
        toast.error("Selected variant not found.");
        return;
      }

      // Create cart item in the format expected by the store
      const cartItem = {
        id: `temp-${Date.now()}`, // Temporary ID, will be replaced by server
        productVariantId: selectedVariant,
        productId: product.id,
        cartId: "", // Will be set by the store
        quantity: quantity,
        productVariant: {
          id: selectedVariant,
          productId: product.id,
          title: currentVariant.title,
          description: currentVariant.description,
          price: String(currentVariant.price),
          stockQuantity: currentVariant.stockQuantity,
          variantType: currentVariant.variantType,
          variantValue: currentVariant.variantValue,
          additionalPrice: String(currentVariant.additionalPrice),
        },
        product: {
          quantity: () => quantity,
          sellerId: product.sellerId,
          id: product.id,
          name: product.name,
          price: String(product.price),
          description: product.description,
          images: product.images,
          variants: product.variants.map(v => ({
            id: v.id,
            variantType: v.variantType,
            variantValue: v.variantValue,
            additionalPrice: String(v.additionalPrice),
          })),
          reviews: product.reviews || [],
        },
        // These will be populated by the store
        image: "",
        description: "",
        rating: "",
        reviews: "",
        price: "",
      };

      // Use the store's addToCart method which includes immediate GET API call
      await addToCart(cartItem, session.user.id);
      
      toast.success("Product added to cart successfully!");
    } catch (error: any) {
      console.error("Error adding product to cart:", error);
      toast.error("There was an error adding the product to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleGoToCart = () => {
    router.push("/cart");
  };

  const handleCheckout = () => {
    if (!session?.user?.id) {
      alert("Please log in to proceed to checkout.");
      return;
    }

    if (!product || !selectedVariant) {
      alert("Please select a product variant before checkout");
      return;
    }

    const variant =
      product.variants.find((v) => v.id === selectedVariant) ||
      product.variants[0];

    router.push(
      `/checkout?productId=${product.id}&variantId=${selectedVariant}&quantity=${quantity}&price=${variant.price}`
    );
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`/api/reviews/product/${params.id}`);
        if (response.data.status === "success") {
          setReviews(response.data.data); // Assuming `data` is an array of reviews
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    if (params.id) {
      fetchReviews();
    }
  }, [params.id]);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!product?.id || !product?.categoryId) return;

      setLoadingSimilarProducts(true);
      try {
        // Fetch products from the same category
        const response = await axios.get(`/api/products`, {
          params: {
            categoryId: product.categoryId
          }
        });

        if (response.data.status === "success") {
          // Filter out the current product and limit to a reasonable number (e.g., 8)
          const filteredProducts = response.data.data
            .filter((p: { id: string }) => p.id !== params.id)
            .slice(0, 8);
          setSimilarProducts(filteredProducts);
        }
      } catch (err) {
        console.error("Error fetching similar products:", err);
      } finally {
        setLoadingSimilarProducts(false);
      }
    };

    fetchSimilarProducts();
  }, [product?.id, product?.categoryId, params.id]);

  // Helper function to convert product to the format expected by ProductCard
  const formatProductForCard = (product: Product) => {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      aboutProduct: product.aboutProduct,
      price: String(product.price),
      stockQuantity: product.stockQuantity,
      variants: product.variants.map(variant => ({
        ...variant,
        additionalPrice: String(variant.additionalPrice || "0"),
      })),
      images: product.images,
      discounts: product.discounts?.map(discount => ({
        ...discount,
        discountValue: String(discount.discountValue),
      })) || []
    };
  };

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text) return "";
    const cleanText = text.replace(/<[^>]*>/g, ""); // Remove HTML tags
    if (cleanText.length <= maxLength) return text;
    return cleanText.substring(0, maxLength) + "...";
  };

  // Helper function to generate breadcrumb items
  const generateBreadcrumbItems = () => {
    if (!product?.category) return [];
    
    const items = [];
    
    // Add parent category if it exists
    if (product.category.parentCategory) {
      items.push({
        label: product.category.parentCategory.name,
        href: `/filter?categoryId=${product.category.parentCategory.id}`
      });
    }
    
    // Add current category
    items.push({
      label: product.category.name,
      href: `/filter?categoryId=${product.category.id}`
    });
    
    // Add product name (no link for current page)
    items.push({
      label: product.name
    });
    
    return items;
  };

  const handleSubmitReview = async () => {
    if (!session?.user?.id) {
      alert("Please log in to submit a review.");
      return;
    }

    if (!rating || !reviewText.trim()) {
      alert("Please provide both a rating and a review.");
      return;
    }
    setIsSubmitting(true);
    try {
      const reviewPayload = {
        userId: session.user.id,
        rating,
        reviewText,
      };

      const response = await axios.post(
        `/api/reviews/product/${product?.id}`,
        reviewPayload
      );

      console.log("Review submitted:", response.data);
      alert("Thank you for your review!");

      setRating(undefined);
      setReviewText("");

      setReviews((prev) => [
        {
          rating,
          reviewText: reviewText,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (error: any) {
      console.error(
        "Error submitting review:",
        axios.isAxiosError(error) ? error.response?.data : error
      );
      alert("There was an error submitting your review. Please try again.");
    } finally {
      setIsSubmitting(false); // ⬅️ Re-enable button
    }
  };

  useEffect(() => {
    if (reviews.length > 0) {
      const distribution = calculateRatingStats(reviews);
      setRatingDistribution(distribution);
      setAverageRating(
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      );
    }
  }, [reviews]);

  const calculateRatingStats = (reviews: SubmittedReview[]) => {
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      percent:
        (distribution[star as keyof typeof distribution] / reviews.length) *
          100 || 0,
    }));
  };

  if (loading) {
    return <ProductDetailPageLoader />;
  }

  if (error || !product) {
    return <div>Error: {error || "Product not found"}</div>;
  }

  const currentVariant = getCurrentVariant();
  const currentVariantImages = getCurrentVariantImages();

  return (
    <>
      <div className="container mx-auto px-4 py-6 overflow-x-hidden">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb items={generateBreadcrumbItems()} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-6">
          {/* First Grid - Product Images (Responsive) - Now shows variant-specific images */}
          <div className="xl:col-span-5 order-1">
            <div className="relative bg-transparent rounded-lg shadow max-w-full mx-auto">
              <div className="relative">
                <div className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded text-sm z-10">
                  <p>Hot Sale</p>
                </div>

                <div className="h-full w-full bg-transparent flex items-center justify-center">
                  <img
                    src={mainImage || "/placeholder.svg"}
                    alt="Main Product"
                    className="max-h-[500px] w-full object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Thumbnail images - now shows variant-specific images */}
              <div className="flex justify-center flex-wrap gap-2 bg-transparent p-2 rounded-lg mt-2">
                {currentVariantImages
                  .filter((img) => img.imageUrl !== mainImage)
                  .map((img) => (
                    <img
                      key={img.id}
                      src={img.imageUrl || "/placeholder.svg"}
                      alt={`Thumbnail`}
                      className={`w-12 h-12 bg-transparent object-cover border-2 rounded-lg cursor-pointer transition-all ${
                        mainImage === img.imageUrl
                          ? "border-red-600 scale-110"
                          : "border-black"
                      }`}
                      onClick={() => setMainImage(img.imageUrl)}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Second Grid - Product Details */}
          <div className="xl:col-span-4 order-2">
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
                {product.name}({product.brand})
                {currentVariant && ` - ${currentVariant.title}`}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                {reviews.length > 0 ? (
                  <>
                    <span className="bg-green-800 text-white px-2 py-1 rounded text-sm">
                      {averageRating.toFixed(1)} ★
                    </span>
                    <span className="text-gray-600">
                      ({reviews.length}{" "}
                      {reviews.length === 1 ? "Review" : "Reviews"})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-600 text-sm">No reviews yet</span>
                )}
              </div>

              {/* Price Display with Discount */}
              {(() => {
                const basePrice = Number(currentVariant?.price || product.price);
                const discounts = getVariantDiscounts();
                const discountedPrice = calculateDiscountedPrice(basePrice, discounts);
                const hasDiscount = discounts.length > 0;

                return (
                  <div className="mt-2">
                    <div className="flex items-center gap-3">
                      <p className={`text-2xl font-bold ${hasDiscount ? 'text-green-700' : 'text-gray-900'}`}>
                        ₹{discountedPrice.toFixed(0)}
                      </p>
                      {hasDiscount && (
                        <>
                          <p className="text-xl text-gray-400 line-through">
                            ₹{basePrice}
                          </p>
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                            {discounts[0].discountType === "percentage" 
                              ? `${discounts[0].discountValue}% OFF` 
                              : `₹${discounts[0].discountValue} OFF`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="mt-4 space-y-2">
                {product.GST && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">GST:</span>
                    <span className="ml-2">{product.GST.percentage}%</span>
                  </div>
                )}
                {product.hsnCode && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">HSN Code:</span>
                    <span className="ml-2">{product.hsnCode}</span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Description
                </h2>
                <p className="text-gray-600 mt-2">
                  {currentVariant?.description || product.description}
                </p>
              </div>

              {product.variants.length > 0 && (
                <div className="mt-4">
                  {selectedVariant && currentVariant && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                          <span className="text-sm font-medium">
                            {Math.max(
                              0,
                              (currentVariant.stockQuantity || 0) - quantity
                            )}{" "}
                            remaining in stock
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              (((currentVariant.stockQuantity || 0) -
                                quantity) /
                                (currentVariant.stockQuantity || 1)) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-4">
                    Available Variants
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const label = `${variant.variantType}-${variant.variantValue} `;
                      const isSelected = selectedVariant === variant.id;

                      return (
                        <div
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant.id)}
                          className={`px-4 py-2 rounded-full border text-sm transition-all duration-200 cursor-pointer max-w-[150px] overflow-hidden text-ellipsis ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 text-blue-600"
                              : "border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Related Products section */}
              {product.relatedProducts && product.relatedProducts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Related Products
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.relatedProducts.map((relatedProduct, index) => (
                      <button
                        key={index}
                        onClick={() => window.open(relatedProduct.url, '_blank')}
                        className="px-4 py-2 rounded-full border border-blue-300 bg-blue-50 text-blue-600 text-sm transition-all duration-200 cursor-pointer hover:bg-blue-100 hover:border-blue-400 hover:shadow-md"
                        title={`Click to visit: ${relatedProduct.url}`}
                      >
                        {relatedProduct.linkName}
                      </button>
                    ))}
                  </div>
                  
                  {/* Display the general linkName if it exists */}
                  {product.linkName && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-600 mb-1">General Link Name:</p>
                      <p className="text-base font-medium text-gray-800">{product.linkName}</p>
                    </div>
                  )}
                </div>
              )}

              {/* About this product section */}
              <div className="mt-6 xl:block hidden">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  About this product
                </h2>
                <div className="mt-2">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: showFullDescription 
                        ? product.aboutProduct 
                        : truncateText(product.aboutProduct, 200)
                    }}
                  />
                  {product.aboutProduct && product.aboutProduct.replace(/<[^>]*>/g, "").length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                    >
                      {showFullDescription ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Third Grid - Price and Actions */}
          <div className="xl:col-span-3 order-3">
            <div className="bg-white rounded-lg shadow p-4 lg:sticky ">
              {(() => {
                const basePrice = Number(currentVariant?.price || product.price);
                const discounts = getVariantDiscounts();
                const discountedPrice = calculateDiscountedPrice(basePrice, discounts);
                const gstPercentage = product.GST?.percentage || 0;
                const priceWithTax = discountedPrice * (1 + gstPercentage / 100);
                
                return (
                  <>
                    <p className="text-gray-500 text-sm">
                      ₹{priceWithTax.toFixed(2)} (Incl. of all taxes)
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-green-700">
                        ₹{discountedPrice.toFixed(0)}
                      </p>
                      {discounts.length > 0 && (
                        <p className="text-gray-400 line-through">
                          ₹{basePrice}
                        </p>
                      )}
                      <span className="text-gray-600 text-sm font-medium">
                        + {gstPercentage}% GST
                      </span>
                    </div>
                  </>
                );
              })()}

              {/* Quantity Selector */}
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Quantity</span>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button
                      className="px-3 py-1 text-lg font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() =>
                        setQuantity((prev) => Math.max(1, prev - 1))
                      }
                      disabled={quantity <= 1 || (currentVariant?.stockQuantity ?? 0) === 0}
                    >
                      −
                    </button>
                    <span className="px-4 py-1">{quantity}</span>
                    <button
                      className="px-3 py-1 text-lg font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (currentVariant) {
                          if (quantity < currentVariant.stockQuantity) {
                            setQuantity((prev) => prev + 1);
                          } else {
                            toast.error(
                              `Maximum quantity reached (${currentVariant.stockQuantity})`,
                              {
                                description:
                                  "You cannot add more than available stock",
                                position: "top-center",
                              }
                            );
                          }
                        }
                      }}
                      disabled={
                        quantity >= (currentVariant?.stockQuantity ?? 0) || (currentVariant?.stockQuantity ?? 0) === 0
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || (currentVariant?.stockQuantity ?? 0) === 0}
                  className="bg-red-600 text-white w-full py-2 rounded-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>
                    {isAddingToCart 
                      ? "Adding..." 
                      : (currentVariant?.stockQuantity ?? 0) === 0 
                        ? "Out of Stock" 
                        : "Add to cart"}
                  </span>
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={(currentVariant?.stockQuantity ?? 0) === 0}
                  className="bg-blue-600 text-white w-full py-2 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {(currentVariant?.stockQuantity ?? 0) === 0 ? "Out of Stock" : "Buy Now"}
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Truck className="w-4 h-4" />
                  <span className="text-sm">
                    Free delivery on orders above ₹5000
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <BadgeCheck className="w-4 h-4" />
                  <span className="text-sm">100% Authentic Products</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm">7 Days Return Policy</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Headset className="w-4 h-4" />
                  <span className="text-sm">24/7 Customer Support</span>
                </div>
                <div className="flex items-center space-x-2 text-red-600">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-semibold">GST Invoice on Every Purchase</span>
                </div>
              </div>

              {/* EMI Affordability Widget */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <span className="mr-2">💳</span>
                  Flexible Payment Options
                </h4>
                <div className="text-xs text-blue-600 mb-2">
                  Choose from various EMI and payment options available
                </div>
                {(() => {
                  // Calculate total amount with discount and GST
                  const basePrice = Number(currentVariant?.price || product.price);
                  const discounts = getVariantDiscounts();
                  const discountedPrice = calculateDiscountedPrice(basePrice, discounts);
                  const gstPercentage = product.GST?.percentage || 0;
                  const totalAmount = discountedPrice * (1 + gstPercentage / 100) * quantity;
                  
                  return (
                    <RazorpayAffordabilityWidget
                      amount={Math.round(totalAmount * 100)} // Convert to paise
                      keyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""}
                      className="w-full"
                      onWidgetLoad={() => {
                        console.log("EMI Widget loaded successfully");
                      }}
                      onWidgetError={(error: any) => {
                        console.error("EMI Widget error:", error);
                      }}
                    />
                  );
                })()}
              </div>
            </div>
          </div>

          {/* About this product section (mobile view) */}
          <div className="xl:hidden col-span-1 order-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                About this product
              </h2>
              <div className="mt-2">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: showFullDescription 
                      ? product.aboutProduct 
                      : truncateText(product.aboutProduct, 200)
                  }}
                />
                {product.aboutProduct && product.aboutProduct.replace(/<[^>]*>/g, "").length > 200 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                  >
                    {showFullDescription ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        <div className="container mt-10 max-w-full overflow-hidden">
          <h1 className="font-semibold text-red-500 text-lg mb-4">
            Similar Products
          </h1>
          {loadingSimilarProducts ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-4 h-[300px]">
                  <Skeleton className="h-[150px] w-full mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : similarProducts.length > 0 ? (
            <Carousel
              plugins={[Autoplay({ delay: 2500 })]}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="py-4">
                {similarProducts.map((item, index) => (
                  <CarouselItem
                    key={item.id}
                    className="md:basis-1/2 lg:basis-1/4 flex items-stretch"
                  >
                    <ProductCard 
                      product={formatProductForCard(item)} 
                      index={index} 
                      className="w-full" 
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="border-gray-600" />
              <CarouselNext className="border-gray-600" />
            </Carousel>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No similar products found</p>
            </div>
          )}
        </div>

        {/* Ratings and Reviews Section */}
        <div className="container mt-10 max-w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-red-600 font-bold text-lg md:text-xl">
              Ratings and reviews
            </h2>
            <Dialog>
              <DialogTrigger asChild>
                <button className="px-4 py-2 text-red-600 font-medium bg-red-100 rounded-lg hover:bg-red-200">
                  Write a Review
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Write your review</DialogTitle>
                  <DialogDescription>
                    Share your experience with this product.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <p className="mb-1 font-medium">Your Rating:</p>
                  <Rating
                    value={rating}
                    onChange={(e) => setRating(e.value ?? undefined)}
                    cancel={false}
                  />
                </div>

                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Type your review here..."
                  className="mt-4"
                />

                <Button
                  onClick={handleSubmitReview}
                  className="mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          {/* Main Ratings Overview */}
          <div className="mt-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between space-y-4 md:space-y-0">
                <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-1/3 space-y-2">
                  <p className="text-black font-bold text-sm sm:text-base md:text-lg leading-relaxed">
                    {product.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-green-900">
                      {averageRating.toFixed(1)}
                    </p>
                    <Star className="w-5 h-5 text-green-900 fill-green-900" />
                  </div>
                  <p className="text-black text-sm font-semibold">
                    Average ratings based on <strong>{reviews.length}</strong>{" "}
                    ratings and <strong>{reviews.length}</strong> reviews
                  </p>
                </div>

                <div className="w-full md:w-2/3 flex flex-col items-center md:items-start space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const rating = ratingDistribution.find(
                      (r) => r.star === star
                    );
                    const percent = rating ? rating.percent : 0;

                    return (
                      <div
                        key={star}
                        className="flex items-center space-x-3 w-full max-w-md"
                      >
                        <span className="w-6 text-sm font-medium">{star}</span>
                        <div className="flex-1 h-3 bg-gray-200 overflow-hidden rounded-full">
                          <div
                            className="h-full bg-green-700 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(percent)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  User Submitted Reviews
                </h3>
                {reviews.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 p-4 rounded-md bg-gray-50"
                  >
                    {/* Top Row: Image + Name */}
                    <div className="flex items-center space-x-4 mb-2">
                      {/* Conditionally render image or fallback icon */}
                      {item.user?.profile ? (
                        <img
                          src={item.user.profile || "/placeholder.svg"}
                          alt={`${item.user?.name}'s profile`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-500" /> // Render the user icon
                      )}

                      <p className="text-sm font-medium text-gray-800">
                        {item.user?.name || "Anonymous"}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-2">
                      <Rating value={item.rating} readOnly cancel={false} />
                      <span className="text-sm text-gray-600">
                        {item.rating} star
                      </span>
                    </div>

                    {/* Review Text */}
                    <p className="text-gray-700 mb-1">{item.reviewText}</p>

                    {/* Date */}
                    <p className="text-gray-500 text-sm">
                      {moment(item.createdAt).format("YYYY-MM-DD")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductPage;
