import Image from "next/image";
import React from "react";

function HowItWorks() {
  return (
    <div className="bg-white text-black py-8 px-4 md:px-8 mt-[7rem]">
      <div className="container mx-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="h-px bg-gray-300 flex-grow"></div>
          <h2 className="text-[#b01116] text-2xl md:text-3xl font-bold px-4 py-[1rem]">
            How It Works
          </h2>
          <div className="h-px bg-gray-300 flex-grow"></div>
        </div>
        <div className="w-full md:h-[55vh] flex flex-col md:flex-row group">
          <div className="group/item p-4 md:p-[2rem] bg-[#90daf5] h-full md:flex-2 hover:md:flex-2 group-hover:md:flex-1 rounded-3xl m-2 transition-all duration-400 cursor-pointer flex flex-col md:flex-row justify-around items-center hover:md:flex-row group-hover:md:flex-col">
            <Image
              src={"/assets/images/become-a-seller/listYourProducts.png"}
              width={312}
              height={394}
              className="w-[200px] md:w-[300px] h-[240px] md:h-[340px]"
              alt="listYourProducts"
            />
            <p className="font-[600] text-[16px] md:text-[20px] text-center md:text-start mt-4 md:mt-0">
              Register & List Your
              <br /> Products
            </p>
          </div>
          <div className="group/item p-4 md:p-[2rem] bg-[#ffbbe2] h-full md:flex-1 hover:md:flex-2 group-hover:md:flex-1 rounded-3xl m-2 transition-all duration-400 cursor-pointer flex flex-col md:flex-col justify-around items-center hover:md:flex-row group-hover:md:flex-col">
            <Image
              src={"/assets/images/become-a-seller/GetOrders.png"}
              width={312}
              height={394}
              className="w-[200px] md:w-[350px] h-[240px] md:h-[340px]"
              alt="Get Orders"
            />
            <p className="font-[600] text-[16px] md:text-[20px] text-center md:text-start mt-4 md:mt-0">
              Get Orders & Start
              <br /> Selling
            </p>
          </div>
          <div className="group/item p-4 md:p-[2rem] bg-[#adaef5] h-full md:flex-1 hover:md:flex-2 group-hover:md:flex-1 rounded-3xl m-2 transition-all duration-400 cursor-pointer flex flex-col md:flex-col justify-around items-center hover:md:flex-row group-hover:md:flex-col">
            <Image
              src={"/assets/images/become-a-seller/pay.png"}
              width={312}
              height={394}
              className="w-[200px] md:w-[300px] h-[240px] md:h-[340px]"
              alt="Receive Payment"
            />
            <p className="font-[600] text-[16px] md:text-[20px] text-center md:text-start mt-4 md:mt-0">
              Receive Your
              <br /> Payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
