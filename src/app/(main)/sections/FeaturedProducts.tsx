"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/common/ProductCard";
import { cn } from "@/lib/utils";
import HoverButton from "@/components/common/HoverButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import axios from "axios";
import CategorySectionLoader from "@/components/CategorySectionLoader ";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const categories = [
  "New Arrival",
  "Best Selling",
  "Top rated",
];

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  stockQuantity: number;
  images: {
    id: string;
    imageUrl: string;
    isPrimary: boolean;
  }[];
  discounts?: any[];
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
};

export default function FeaturedProducts() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);

      try {
        const response = await axios.get("/api/products");
        setProducts(response.data.data.slice(0, 8));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!loadingProducts) {
      setInitialLoad(false);
    }
  }, [loadingProducts]);

  const handlefilter = () => {
    router.push("/filter");
  };

  // Convert API products to format ProductCard expects
  const convertedProducts = products.map(product => {
    return {
      ...product,
      variants: product.variants?.map(variant => ({
        ...variant,
        // Ensure these properties are always present even if optional in API
        title: variant.title || variant.variantValue,
        description: variant.description || product.description,
        stockQuantity: variant.stockQuantity || 0
      })) || []
    };
  });

  return (
    <div className="bg-white text-black py-8 md:px-8 md:my-[2rem] mb-0">
      <div className="container mx-auto">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-center mb-8">
          <div className="h-px bg-gray-300 flex-grow"></div>
          <h2 className="text-3xl font-bold px-4 py-[2rem]" style={{ color: '#D3B750' }}>
            Shop by popular Products
          </h2>
          <div className="h-px bg-gray-300 flex-grow"></div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden px-4 pt-2 pb-4 flex justify-between items-center">
          <div>
          <h2 className="text-xl font-bold" style={{ color: '#D3B750' }}>
            Popular Products
          </h2>
          <p className="text-gray-500 text-sm">Discover our best sellers</p>
          </div>
          <div 
            className="text-sm font-medium md:hidden block cursor-pointer"
            style={{ color: '#D3B750' }}
            onClick={handlefilter}
          >
            View All
          </div>
        </div>

        <Tabs defaultValue={categories[0]}>
          <TabsList className="md:mb-0 mb-4 md:justify-center justify-start md:px-0 px-4 md:bg-transparent bg-white overflow-x-auto whitespace-nowrap scrollbar-hide">
            {categories.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="md:rounded-md rounded-full md:px-4 px-5 md:py-2 py-1.5 md:mx-1 mx-1.5 md:min-w-0 min-w-[100px] md:border-0 border md:shadow-none shadow-sm"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="w-full md:px-[2rem] px-0">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <div className="w-full md:flex justify-end md:px-0 px-4 hidden ">
                    <HoverButton onClick={handlefilter} className="md:text-base text-sm">Show More</HoverButton>
                  </div>
                  
                  <CarouselContent className="py-4 md:px-0 px-4">
                    {loadingProducts
                      ? Array.from({ length: 8 }).map((_, index) => (
                        <CarouselItem key={index} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                          <Skeleton className="h-[200px] w-full" />
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-6 w-1/4" />
                          </div>
                        </CarouselItem>
                      ))
                      : convertedProducts.map((product, index) => (
                        <CarouselItem
                          key={product.id}
                          className="basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 flex items-stretch"
                        >
                          <div className="w-full md:transform-none transform scale-[0.98] md:shadow-none shadow-sm md:rounded-none rounded-xl overflow-hidden">
                            <ProductCard 
                              index={index} 
                              product={product} 
                              smallCardVariant={isMobile}
                              className={isMobile ? "" : index === 0 ? "md:col-span-2 md:row-span-2" : ""}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                  </CarouselContent>
                  <div className="hidden md:block">
                    <CarouselPrevious className="border-gray-600" />
                    <CarouselNext className="border-gray-600" />
                  </div>
                </Carousel>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}