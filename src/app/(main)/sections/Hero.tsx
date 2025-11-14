"use client"
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

export default function Hero() {
  return (
    <div className="w-full px-4 md:px-0 pt-4 md:pt-0">
      <Carousel 
        className="w-full" 
        plugins={[Autoplay({ delay: 3000 })]}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          <CarouselItem className="w-full">
            <div className="mx-auto relative h-[600px] w-full md:rounded-none rounded-2xl overflow-hidden md:shadow-none shadow-lg">
              <Image
                src="/assets/images/Landingpage/flower.jpg"
                alt="Dried Flower Bouquet"
                fill
                className="object-cover"
                priority
              />
            </div>
          </CarouselItem>
          <CarouselItem className="w-full">
            <div className="mx-auto relative h-[600px] w-full md:rounded-none rounded-2xl overflow-hidden md:shadow-none shadow-lg">
              <Image
                src="/assets/images/Landingpage/gajalask.jpg"
                alt="Gajalakshmi Wood Carved Panel"
                fill
                className="object-cover"
              />
            </div>
          </CarouselItem>
          <CarouselItem className="w-full">
            <div className="mx-auto relative h-[600px] w-full md:rounded-none rounded-2xl overflow-hidden md:shadow-none shadow-lg">
              <Image
                src="/assets/images/Landingpage/gajalaskshmi.jpg"
                alt="Wooden Crafts"
                fill
                className="object-cover"
              />
            </div>
          </CarouselItem>
          <CarouselItem className="w-full">
            <div className="mx-auto relative h-[600px] w-full md:rounded-none rounded-2xl overflow-hidden md:shadow-none shadow-lg">
              <Image
                src="/assets/images/Landingpage/mobile.jpg"
                alt="Premium Wooden Mobile Stand"
                fill
                className="object-cover"
              />
            </div>
          </CarouselItem>
        </CarouselContent>
        
        {/* Mobile indicator dots */}
        <div className="md:hidden flex justify-center mt-2 mb-2">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D3B750' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>
        
        {/* <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" /> */}
      </Carousel>
    </div>
  );
}
