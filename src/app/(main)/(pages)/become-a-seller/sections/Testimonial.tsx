"use client"
import ProductCard from "@/components/common/ProductCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { type CarouselApi } from "@/components/ui/carousel";
import TestimonialCard from "@/components/common/TestimonialCard";

function Testimonial() {
    const [api, setApi] = useState<CarouselApi>();
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
      if (!api) return;

      const onSelect = () => {
        setActiveIndex(api.selectedScrollSnap());
      };

      api.on("select", onSelect);
      api.on("reInit", onSelect);

      return () => {
        api.off("select", onSelect);
        api.off("reInit", onSelect);
      };
    }, [api]);

    const testimonials = [
        {
          id: 1,
          name: "John Smith",
          role: "Seller",
          comment: "Make Easy has transformed my business. The platform is intuitive and the support is excellent.",
          image: "/assets/images/testimonials/1.jpg",
        },
        {
          id: 2,
          name: "Sarah Johnson",
          role: "Business Owner",
          comment: "I've seen a 200% increase in sales since joining Make Easy. Highly recommended!",
          image: "/assets/images/testimonials/2.jpg",
        },
        {
          id: 3,
          name: "Mike Brown",
          role: "Entrepreneur",
          comment: "The best e-commerce platform for sellers. Period.",
          image: "/assets/images/testimonials/3.jpg",
        },
        {
          id: 4,
          name: "Lisa Chen",
          role: "Shop Owner",
          comment: "Make Easy made it simple to start my online business.",
          image: "/assets/images/testimonials/4.jpg",
        },
        {
          id: 5,
          name: "David Wilson",
          role: "Artisan",
          comment: "Great platform for creative sellers like me.",
          image: "/assets/images/testimonials/5.jpg",
        },
        {
          id: 6,
          name: "Emma Davis",
          role: "Retailer",
          comment: "The seller tools are fantastic. Makes management easy.",
          image: "/assets/images/testimonials/6.jpg",
        },
    ];

  return (
    <div className="bg-white text-black px-4 md:px-8 mt-8 md:mt-16">
      <div className="container mx-auto">
        <div className="flex items-center justify-center mb-6 md:mb-15">
          <div className="h-px bg-gray-300 flex-grow"></div>
          <h2 className="text-[#b01116] text-xl md:text-3xl font-bold px-4 py-2 md:py-4">
            What Sellers Say
          </h2>
          <div className="h-px bg-gray-300 flex-grow"></div>
        </div>
        
        <div className="w-full min-h-[400px] md:h-[55vh] px-2 md:px-8">
          <Carousel
            plugins={[
              Autoplay({
                delay: 3000,
                stopOnInteraction: true,
              })
            ]}
            opts={{
              align: "center",
              loop: true,
              skipSnaps: false,
              dragFree: true
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={testimonial.id}
                  className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <div 
                    className={`
                      transition-all duration-300 ease-out transform 
                      ${activeIndex === index 
                        ? 'scale-100 md:scale-110 z-10 opacity-100' 
                        : 'scale-95 md:scale-90 opacity-60 blur-[0.5px]'
                      }
                      h-full
                    `}
                  >
                    <TestimonialCard 
                      // name={testimonial.name}
                      // role={testimonial.role}
                      // comment={testimonial.comment}
                      // image={testimonial.image}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="hidden md:block">
              <CarouselPrevious className="border-gray-600 -left-12" />
              <CarouselNext className="border-gray-600 -right-12" />
            </div>

            <div className="flex justify-center gap-2 mt-4 md:hidden">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeIndex === index ? 'bg-[#b01116] w-4' : 'bg-gray-300'
                  }`}
                  onClick={() => api?.scrollTo(index)}
                />
              ))}
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  );
}

export default Testimonial;
