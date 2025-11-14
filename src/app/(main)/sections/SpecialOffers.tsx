"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/common/ProductCard";
import { cn } from "@/lib/utils";
import HoverButton from "@/components/common/HoverButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategorySectionLoader from "@/components/CategorySectionLoader ";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"
import { useRouter } from "next/navigation";
import axios from "axios";

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
    discounts: {
      id: string;
      discountType: string;
      discountValue: number;
      startDate: string;
      endDate: string;
    }[];
  }[];
};

const calculateMaxDiscountPercentage = (product: Product): number => {
  let maxDiscountPercentage = 0;
  
  product.variants.forEach(variant => {
    variant.discounts.forEach(discount => {
      const discountPercentage = discount.discountType === 'percentage'
        ? Number(discount.discountValue)
        : (Number(discount.discountValue) / variant.price) * 100;
      
      maxDiscountPercentage = Math.max(maxDiscountPercentage, discountPercentage);
    });
  });

  return maxDiscountPercentage;

};

const categories = ["New Arrival", "Best Selling", "Top rated"];

export default function SpecialOffers() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await axios.get("/api/products?onlyDiscounted=true");
        setProducts(response.data.data);
      } catch (error) {
        console.error("Failed to fetch products", error);
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

  return (
    <div className="bg-white text-black py-8 md:px-8 md:my-[2rem] my-0">
      <div className="container mx-auto">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-center mb-8">
          <div className="h-px bg-gray-300 flex-grow"></div>
          <h2 className="text-3xl font-bold px-4 py-[2rem]" style={{ color: '#D3B750' }}>
            Special Offers
          </h2>
          <div className="h-px bg-gray-300 flex-grow"></div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden px-4 pt-2 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#D3B750' }}>
                Special Offers
              </h2>
              <p className="text-gray-500 text-sm">Limited time deals</p>
            </div>
            <div className="hidden md:block">
              <HoverButton onClick={handlefilter} className="text-sm py-1.5 px-3">View All</HoverButton>
            </div>
            <div 
            className="text-sm font-medium md:hidden block cursor-pointer"
            style={{ color: '#D3B750' }}
            onClick={handlefilter}
          >
            View All
          </div>
          </div>
        </div>

        <div className="w-full md:px-[2rem] px-0">
          <Carousel
            plugins={[
              Autoplay({ delay: 2000 })
            ]}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="py-4 md:px-0 px-4">
              {loadingProducts ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/4">
                    <CategorySectionLoader index={index} />
                  </CarouselItem>
                ))
              ) : (
                products.map((product, index) => (
                  <CarouselItem
                    key={product.id}
                    className="md:basis-1/2 lg:basis-1/4 basis-[85%] flex items-stretch"
                  >
                    <div className="w-full md:transform-none transform scale-[0.98] md:shadow-none shadow-md md:rounded-none rounded-2xl overflow-hidden relative">
                      <div className="absolute top-2 left-2 z-10 text-white text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#D3B750' }}>
                        {calculateMaxDiscountPercentage(product)}% OFF
                      </div>
                      <ProductCard index={index + 1} product={product} className="h-full" />
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="border-gray-600" />
              <CarouselNext className="border-gray-600" />
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  );
}
