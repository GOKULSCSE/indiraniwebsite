"use client";
import { usePaymentStore } from "@/store/paymentStore";
import axios from "axios";
import Script from "next/script";
import React, { useEffect, ReactNode } from "react";

interface PaymentButtonProps {
  children: (handlePayment: (orderData: any, cartId?: string) => Promise<void>) => ReactNode;
  companyName?: string;
  description?: string;
  customerInfo: {
    name: string;
    email: string;
    contact: string;
  };
  themeColor?: string;
  onSuccess?: () => void;
  onFailure?: () => void;
}

const PaymentButton = ({
  children,
  companyName = "Make You Easy",
  description = "Payment for your order",
  customerInfo,
  themeColor = "#3399cc",
  onSuccess,
  onFailure,
}: PaymentButtonProps) => {
  // const loadRazorpay = () => {
  //   if (typeof document !== 'undefined') {
  //     const script = document.createElement("script");
  //     script.src = "https://checkout.razorpay.com/v1/checkout.js";
  //     script.async = true;
  //     document.body.appendChild(script);
  //   }
  // };

  // useEffect(() => {
  //   loadRazorpay();
  // }, []);

  const { setIsPaymentProcessing, setOrderId ,setIsPaymentSuccess} = usePaymentStore();

  const handlePayment = async (orderData: any, cartId?: string) => {
    const response = await axios.post("/api/user/orders", orderData);
    const order = response.data.data;
    const order_db_id = order.db_order_id;
    const all_order_ids = order.all_order_ids; // Get all order IDs for multi-seller orders

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: companyName,
      description: description,
      handler: async function (response: any) {
        setIsPaymentProcessing(true);
        const verifyResponse = await fetch("/api/verifyPayment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: order.id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            order_db_id: order_db_id,
            all_order_ids: all_order_ids, // Pass all order IDs for verification
            cartId: cartId,
          }),
        });

        const verifyResult = await verifyResponse.json();
        if (verifyResult.success) {
          onSuccess ? onSuccess() : alert("Payment Verified Successfully!");
          setIsPaymentProcessing(false);
          setOrderId(order.db_order_id);
          setIsPaymentSuccess(true);
        } else {
          onFailure ? onFailure() : alert("Payment Verification Failed!");
          setIsPaymentProcessing(false);
        }
      },
      prefill: customerInfo,
      theme: { color: themeColor },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <React.Fragment>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      {children(handlePayment)}
    </React.Fragment>
  );
};

export default PaymentButton;
