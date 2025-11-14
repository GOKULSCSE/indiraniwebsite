import { Award, RotateCcw, Truck } from "lucide-react";
import Image from "next/image";
import React from "react";

function Hero() {
  return (
    <div className="mx-auto relative h-[500px] md:h-[74vh] w-full bg-[url('/assets/images/become-a-seller/Banner.png')] bg-cover bg-center bg-no-repeat mb-[3.5rem]">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full">
        <div className="col-span-1 flex items-center justify-center px-4 md:px-0">
          <div className="flex flex-col gap-4 text-[#050505]">
            <h1 className="text-3xl md:text-5xl font-bold">Sell Online</h1>
            <h2 className="text-4xl md:text-6xl font-bold text-[#050505]  ">
              Grow Your Business
            </h2>
            <p className="text-[#050505] max-w-md text-sm md:text-base ">
              Join make you easy – Zero Hassle, Maximum Profit
            </p>
            <button className="bg-[#B01116] text-white px-6 py-3 rounded w-fit hover:bg-red-800 text-sm md:text-base">
              Shop Now
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white py-4 border-t border-b mx-auto w-[90%] sm:w-[80%] mt-[-5rem] mb-[2rem] text-black shadow-[0px_0px_13.1px_0px_rgba(0,0,0,0.15)] rounded-lg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-gray-200">
            <div className="flex flex-col items-center justify-center p-4">
              <Image
                src={"/assets/icons/ZeroCommission.png"}
                width={35}
                height={35}
                alt="ZeroCommission_icon"
                className="mb-2 sm:mb-3 w-[30px] h-[30px] sm:w-[40px] sm:h-[40px]"
              />
              <h3 className="font-[600] text-xs sm:text-lg mb-1 text-center">
                Zero Commission for <br /> First 3 Months
              </h3>
            </div>

            <div className="flex flex-col items-center justify-center p-4">
              <Image
                src={"/assets/icons/FreeShipping.png"}
                width={35}
                height={35}
                alt="ZeroCommission_icon"
                className="mb-2 sm:mb-3 w-[30px] h-[30px] sm:w-[40px] sm:h-[40px]"
              />
              <h3 className="font-[600] text-xs sm:text-lg mb-1 text-center">
                Free Shipping Assistance
              </h3>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <Image
                src={"/assets/icons/WeeklyPayouts.png"}
                width={35}
                height={35}
                alt="ZeroCommission_icon"
                className="mb-2 sm:mb-3 w-[30px] h-[30px] sm:w-[40px] sm:h-[40px]"
              />
              <h3 className="font-[600] text-xs sm:text-lg mb-1 text-center">
                Weekly Payouts & Fast Payments
              </h3>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <Image
                src={"/assets/icons/SellerSupport.png"}
                width={35}
                height={35}
                alt="ZeroCommission_icon"
                className="mb-2 sm:mb-3 w-[30px] h-[30px] sm:w-[40px] sm:h-[40px]"
              />
              <h3 className="font-[600] text-xs sm:text-lg mb-1 text-center">
                24/7 Seller Support
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
