import { create } from 'zustand';

interface PaymentStore {
  isPaymentProcessing: boolean;
  setIsPaymentProcessing: (isProcessing: boolean) => void;
  isPaymentSuccess: boolean;
  setIsPaymentSuccess: (isSuccess: boolean) => void;
  orderId: string;
  setOrderId: (orderId: string) => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  isPaymentProcessing: false,
  setIsPaymentProcessing: (isProcessing) => set({ isPaymentProcessing: isProcessing }),
  isPaymentSuccess: false,
  setIsPaymentSuccess: (isSuccess) => set({ isPaymentSuccess: isSuccess }),
  orderId: "",
  setOrderId: (orderId) => set({ orderId: orderId }),
}));
