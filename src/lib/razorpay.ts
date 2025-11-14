import Razorpay from "razorpay";

class RazorpayInstance {
  private static instance: Razorpay;

  private constructor() {}

  public static getInstance(): Razorpay {
    if (!RazorpayInstance.instance) {
      RazorpayInstance.instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });
    }

    return RazorpayInstance.instance;
  }
}

export const razorpay = RazorpayInstance.getInstance();
