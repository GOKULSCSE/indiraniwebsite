import React from "react";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

const SplashScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 md:w-4 md:h-4 bg-white/20 rounded-full animate-float"></div>
        <div
          className="absolute top-40 right-32 w-1 h-1 md:w-3 md:h-3 bg-white/30 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-32 left-16 w-3 h-3 md:w-5 md:h-5 bg-white/10 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-1.5 h-1.5 md:w-3 md:h-3 bg-white/25 rounded-full animate-float"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      {/* Main content */}
      <div className="text-center z-10 w-full max-w-6xl px-4">
        {/* Brand name - Second sequence */}
        <div className="animate-fade-in-delay-200 flex flex-row items-center justify-center scale-100 md:scale-125 lg:scale-150">
            <div className="flex justify-center items-center animate-zoom-in">
              <div className="relative">
                <div className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full flex items-center justify-center animate-glow p-4">
                  <Image
                    src="/assets/indiranilogo.png"
                    alt="Kaaladi Handicrafts"
                    width={200}
                    height={200}
                    className="object-contain"
                  />
                </div>
                <div className="absolute inset-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full border-4 border-white/30 animate-ping"></div>
                <div
                  className="absolute inset-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full border-2 border-white/20 animate-ping"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <div
                  className="absolute inset-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full border border-white/10 animate-ping"
                  style={{ animationDelay: "1s" }}
                ></div>
              </div>
            </div>
        </div>

        {/* Tagline - Third sequence */}
        <div className="animate-fade-in-delay-400 mt-[3rem] md:mt-[5rem]">
          <p className="text-xl md:text-3xl lg:text-4xl text-red-100 mb-8 font-light max-w-md md:max-w-2xl mx-auto">
            ur ❤️ meets art
          </p>
        </div>

        {/* Shopping icon with loading indicator - Fourth sequence */}
        {/* <div className="flex items-center justify-center space-x-4 animate-fade-in-delay-600 mb-6">
          <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white animate-float" />
          <div className="flex space-x-2 md:space-x-3">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.3s" }}
            ></div>
            <div
              className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div> */}

        {/* Loading text - Fifth sequence */}
        <div className="animate-fade-in-delay-800">
          <p className="text-red-200 text-sm md:text-base lg:text-lg mt-4 opacity-80">
            Preparing your shopping experience...
          </p>
        </div>

        {/* Progress indication - Sixth sequence */}
        {/* <div className="mt-6 animate-fade-in-delay-800">
          <div className="w-48 md:w-64 lg:w-80 h-1 md:h-2 bg-red-800/30 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-white to-red-200 rounded-full animate-pulse"
              style={{
                width: "60%",
                animation: "slide-in-left 2s ease-out infinite",
              }}
            ></div>
          </div>
        </div> */}
      </div>

      {/* Bottom decoration with animated gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 md:h-48 lg:h-64 bg-gradient-to-t from-red-800/50 to-transparent animate-fade-in-delay-300"></div>

      {/* Side decorative elements */}
      <div
        className="absolute left-0 top-1/2 w-1 md:w-2 h-24 md:h-36 lg:h-48 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-slide-in-left"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute right-0 top-1/2 w-1 md:w-2 h-24 md:h-36 lg:h-48 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-slide-in-right"
        style={{ animationDelay: "1.2s" }}
      ></div>
    </div>
  );
};

export default SplashScreen;
