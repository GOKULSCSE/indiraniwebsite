"use client";

import Lottie from "lottie-react";
import animationData from "../../../public/assets/lottie/paymentprocessing.json";

interface PaymentLoadingScreenProps {
  isVisible: boolean;
}

const PaymentLoadingScreen: React.FC<PaymentLoadingScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center">
      <div className="w-[25rem] h-[25rem]">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default PaymentLoadingScreen;
