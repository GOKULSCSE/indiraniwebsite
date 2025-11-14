"use client"
import { AspectRatio } from "@/components/ui/aspect-ratio";
import FeaturedProducts from "./sections/FeaturedProducts";
import Hero from "./sections/Hero";
import Image from "next/image";
import ShopByPopularCategory from "./sections/ShopByPopularCategory";
import TopTrendingProducts from "./sections/TopTrendingProducts";
import SpecialOffers from "./sections/SpecialOffers";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import PaymentButton from "@/components/common/Payment/PaymentButton";
import { Button } from "@/components/ui/button";
import Intro from "@/components/intro";
import { useState } from "react";

export default function Home() {


  return (
    <>
      {/* <Intro onComplete={handleIntroComplete} /> */}
      
      {/* Main content - hidden on mobile until intro completes */}
      <div className={`w-full md:bg-white bg-gray-50 `}>
        <Hero />
        <ShopByPopularCategory />
        <TopTrendingProducts />
        {/* <div className="w-full">
          Desktop Image (hidden on mobile)
          <div className="hidden md:block">
            <Image
              src="/assets/images/Landingpage/Banner3.png"
              alt="Desktop Banner"
              className="object-cover w-full"
              width={1920}
              height={1080}
            />
          </div>
          
          Mobile Image (hidden on desktop)
          <div className="block md:hidden px-4 py-2">
            <div className="rounded-2xl overflow-hidden shadow-md">
              <Image
                src="/assets/images/Landingpage/Banner33.png" 
                alt="Mobile Banner"
                className="object-cover w-full"
                width={600}  
                height={400} 
              />
            </div>
          </div>
        </div> */}
        <FeaturedProducts />
        {/* <div className="w-full mb-[3rem] relative">
          <div
            className="relative w-full h-[500px] md:h-[600px] bg-cover bg-center md:rounded-none rounded-2xl mx-auto md:mx-0 md:w-full max-w-[92%] md:max-w-none overflow-hidden md:overflow-visible"
            style={{
              backgroundImage: "url('/assets/images/Landingpage/Banner4.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                background:
                  "linear-gradient(181.86deg, #000000 6.27%, rgba(47, 47, 47, 0.8) 98.58%)",
              }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full grid grid-cols-1 md:grid-cols-2">
              <div className="flex items-center justify-center px-4 md:px-0">
                <div className="flex flex-col gap-4 text-white">
                  <Image
                    alt="Banner-sub-Image"
                    src={"/assets/images/Landingpage/ews_logo.png"}
                    width={141}
                    height={48}
                    className="w-[100px] md:w-[141px]"
                  />
                  <div className="text-xs md:text-sm text-white w-fit px-2 rounded mt-[-1rem]">
                    Tool Technologies
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold">
                    ZERO-ZERO ADJUSTMENT <br className="hidden md:block" /> NUT ER 25
                  </h1>

                  <button className="bg-white text-[#0061AB] px-4 md:px-5 py-2 md:py-3 rounded-xl w-fit cursor-pointer hover:bg-[#0061AB] hover:text-white text-xs md:text-sm lg:text-base transition duration-500 ease-in-out"
                  onClick={() => (window.location.href = "/filter")}>
                    Shop Now
                  </button>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <Image
                  alt="Banner-sub-Image"
                  src={"/assets/images/Landingpage/Banner4_image.svg"}
                  className="w-auto h-[75%]"
                  width={734}
                  height={451}
                />
              </div>
            </div>
          </div>
        </div> */}
        <SpecialOffers />

        {/* Mobile app-like bottom navigation - only visible on mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex justify-around items-center py-2 z-10">
          <button className="flex flex-col items-center justify-center p-2 w-1/5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 w-1/5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <span className="text-xs mt-1">Categories</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 w-1/5">
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="absolute -top-1 -right-1 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center" style={{ backgroundColor: '#D3B750' }}>3</span>
            </div>
            <span className="text-xs mt-1">Cart</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 w-1/5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>

        {/* Add bottom padding on mobile to account for the fixed navigation */}
        <div className="md:hidden h-16"></div>
      </div>
    </>
  );
}
