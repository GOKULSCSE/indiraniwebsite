/* Become a seller page commented out
import React from "react";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";
import Testimonial from "./sections/Testimonial";
import SellerRegistration from "./sections/SellerRegistration";

function Page() {
  return (
    <div className="w-full">
      <Hero />
      <HowItWorks />
      <div className="w-full flex justify-center items-center md:mt-0 mt-20">
        <SellerRegistration />
      </div>
    </div>
  );
}

export default Page;
*/

// Placeholder component to prevent routing errors
function Page() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <p className="text-gray-500">This page is currently unavailable.</p>
    </div>
  );
}

export default Page;
