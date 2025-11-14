import { create } from 'zustand';

interface CartItem {
  id: number;
  description: string;
  price: number;
  quantity: number;
  image: string;
  rating: number;
  reviews: number;
  selected: boolean;
}

interface CheckoutFormData {
  fullName: string;
  email: string;
  number: string;
  pincode: string;
  doorNo: string;
  landmark: string;
  address: string;
  city: string;
  state: string;
  country: string;
}
interface CheckoutStore {
  formData: CheckoutFormData;
  savedAddress: CheckoutFormData | null;
  cartItems: CartItem[];
  activeTab: 'address' | 'payment';

  setFormData: (data: Partial<CheckoutFormData>) => void;
  saveAddress: () => void;
  setActiveTab: (tab: 'address' | 'payment') => void;
  updateQuantity: (id: number, newQuantity: number) => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  formData: {
    fullName: '',
    number: '',
    doorNo: '',
    address: '',
    state: '',
    email: '',
    pincode: '',
    landmark: '',
    city: '',
    country: '',
  },
  savedAddress: null,
  activeTab: 'address',
  cartItems: [
    
  ],

  setFormData: (data) =>
    set((state) => ({
      formData: { 
        ...state.formData, 
        ...data  // ✅ Only updates the changed field
      }
    }), false),// 🔥 Prevent extra re-renders
  
  
  

  saveAddress: () =>
    set((state) => ({
      savedAddress: state.formData,
      activeTab: 'payment',
    })),

  setActiveTab: (tab) => set(() => ({ activeTab: tab })),

  updateQuantity: (id, newQuantity) =>
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
      ),
    })),
}));
