import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import _ from "lodash";
import { ReactNode } from "react";

// In your cartStore.ts file, update the productVariant interface to include product:
interface CartItem {
  productVariantId: string;
  productVariant: {
    id: string;
    productId: string;
    title: string;
    description: string;
    price: string;
    stockQuantity: number;
    variantType: string;
    variantValue: string;
    additionalPrice: string;
    product?: {  // Add this property to match your API response
      id: string;
      name: string;
      price: string;
      description: string;
      images?: {
        id: string;
        imageUrl: string;
        isPrimary: boolean;
      }[];
      reviews?: {
        id: string;
        rating: number;
        reviewText: string | null;
        createdAt: string;
      }[];
    }
  };
  // Keep all your other properties the same
  image: string | undefined;
  description: ReactNode;
  rating: ReactNode;
  reviews: ReactNode;
  price: ReactNode;
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  isSelected?: boolean;
  product: {
    quantity(quantity: any): unknown;
    sellerId: any;
    id: string;
    name: string;
    price: string;
    description: string;
    images?: {
      id: string;
      imageUrl: string;
      isPrimary: boolean;
    }[];
    variants: {
      id: string;
      variantType: string;
      variantValue: string;
      additionalPrice: string;
    }[];
    reviews: {
      id: string;
      rating: number;
      reviewText: string | null;
      createdAt: string;
    }[];
  };
}

interface CartState {
  cartId: string | null;
  cartItems: CartItem[];
  checkoutItems: CartItem[];
  lastUpdated: number | null;
  setCartId: (id: string) => void;
  setCartItems: (items: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
  addToCart: (newItem: CartItem, userId?: string) => Promise<void>;
  updateQuantity: (
    id: string,
    quantity: number,
    productVariantId: string,
    callBack?: () => void // Make this parameter optional
  ) => Promise<void>;
  checkSelect: (id: string) => void;
  removeItem: (id: string) => Promise<void>;
  checkout: () => CartItem[];
  fetchCart: (userId: string) => Promise<void>;
  refreshCart: (userId: string) => Promise<void>;
  getCartCount: () => number;
  forceUpdate: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      return {
        cartId: null,
        cartItems: [],
        checkoutItems: [],
        lastUpdated: null,

        setCartId: (id: string) => set({ cartId: id }),

        setCartItems: (items: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
          if (typeof items === 'function') {
            set((state) => {
              const currentItems = Array.isArray(state.cartItems) ? state.cartItems : [];
              const newItems = items(currentItems);
              return { cartItems: newItems };
            });
          } else {
            const newItems = Array.isArray(items) ? items : [];
            set((state) => {
              return { cartItems: newItems };
            });
          }
        },

        // Add to cart, saving both variant ID and variant details
        addToCart: async (newItem: CartItem, userId?: string) => {
          const { cartItems } = get();
          const originalItems = Array.isArray(cartItems) ? cartItems : [];
          
          try {
            // Prepare the product variant object
            const productVariant = {
              id: newItem.productVariantId,
              productId: newItem.productId,
              title: newItem.productVariant.title,
              description: newItem.productVariant.description,
              price: newItem.productVariant.price,
              stockQuantity: newItem.productVariant.stockQuantity,
              variantType: newItem.productVariant.variantType,
              variantValue: newItem.productVariant.variantValue,
              additionalPrice: newItem.productVariant.additionalPrice,
            };

            // Optimistically update the local state first
            set((state) => {
              const currentItems = Array.isArray(state.cartItems) ? state.cartItems : [];
              const existingItem = currentItems.find(
                (item) => item.productVariantId === newItem.productVariantId
              );

              if (existingItem) {
                return {
                  cartItems: currentItems.map((item) =>
                    item.productVariantId === newItem.productVariantId
                      ? { ...item, quantity: item.quantity + 1 }
                      : item
                  ),
                };
              } else {
                return {
                  cartItems: [
                    ...currentItems,
                    {
                      ...newItem,
                      productVariant: productVariant,
                      quantity: 1,
                      isSelected: false,
                    },
                  ],
                };
              }
            });

            // Send request to add item to the cart
            const response = await axios.post("/api/user/cart", {
              userId: userId,
              items: [
                {
                  productVariantId: newItem.productVariantId,
                  quantity: 1,
                },
              ],
            });

            // Debug: Log the response
            console.log('Cart API response:', response.data);

            // If the API call fails, we could rollback here
            if (response.data?.status !== "success") {
              throw new Error(`Failed to add item to cart: ${response.data?.message || 'Unknown error'}`);
            }

            // Fetch the updated cart from server to sync with database
            if (userId) {
              try {
                const cartResponse = await axios.get(`/api/user/cart?userId=${userId}`);
                if (cartResponse.data?.status === "success" && cartResponse.data?.data) {
                  const cartData = cartResponse.data.data;
                  set({
                    cartId: cartData.id,
                    cartItems: cartData.items || [],
                    lastUpdated: Date.now(),
                  });
                }
              } catch (fetchError) {
                console.warn("Failed to fetch updated cart:", fetchError);
                // Don't throw here, the optimistic update is already applied
              }
            }

            // Log the current state for debugging
            console.log('Cart store state after adding item:', get());
          } catch (error) {
            console.error("Failed to add item to cart:", error);
            // Rollback to original state on error
            set({ cartItems: originalItems });
            throw error;
          }
        },

        // Update the quantity of an item in the cart
        updateQuantity: async (cartItemId: string, quantity: number, productVariantId: string, callBack?: () => void) => {
          const { cartId, cartItems } = get();
          const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
        
          try {
            // Optimistically update local state first
            set({
              cartItems: safeCartItems.map(item => 
                item.id === cartItemId 
                  ? { ...item, quantity: Math.max(1, quantity) } 
                  : item
              )
            });
        
            const payload = {
              id: cartItemId,
              cartId,
              productVariantId,
              quantity: Math.max(1, quantity),
            };
        
            await axios.put("/api/user/cart", payload);
            
            // Only call callback if it was provided
            if (callBack) {
              await callBack();
            }
          } catch (error) {
            console.error("Failed to update quantity:", error);
            // Revert to previous state if error occurs
            set({ cartItems: safeCartItems });
          }
        },

        checkSelect: (id: string) => {
          set((state) => {
            const safeCartItems = Array.isArray(state.cartItems) ? state.cartItems : [];
            return {
              cartItems: safeCartItems.map((item) =>
                item.id === id ? { ...item, isSelected: !item.isSelected } : item
              ),
            };
          });
        },

        removeItem: async (id: string) => {
          const { cartItems } = get();
          const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

          if (!id) {
            console.warn("❌ Tried to remove item with invalid ID:", id);
            return;
          }

          try {
            await axios.delete("/api/user/cart", {
              data: {
                ids: [id], 
              },
            });

            const updatedItems = safeCartItems.filter((item) => item.id !== id);

            set(() => ({
              cartItems: updatedItems,
            }));
          } catch (error) {
            console.error("❌ Failed to remove item:", error);
          }
        },

        checkout: () => {
          const { cartItems } = get();
          const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
          set({ checkoutItems: safeCartItems });
          return safeCartItems;
        },

        fetchCart: async (userId: string) => {
          try {
            const response = await axios.get("/api/user/cart", {
              params: { userId },
            });
            const cartData = response.data.data;

            if (!_.isEmpty(cartData)) {
              set({ 
                cartId: cartData.id, 
                cartItems: cartData.items,
                lastUpdated: Date.now()
              });
            } else {
              set({ cartId: null, cartItems: [], lastUpdated: Date.now() });
            }
          } catch (error) {
            console.error("Failed to fetch cart data:", error);
            set({ cartId: null, cartItems: [], lastUpdated: Date.now() });
          }
        },

        refreshCart: async (userId: string) => {
          try {
            const response = await axios.get("/api/user/cart", {
              params: { userId },
            });
            const cartData = response.data.data;

            if (!_.isEmpty(cartData)) {
              set({ 
                cartId: cartData.id, 
                cartItems: cartData.items,
                lastUpdated: Date.now()
              });
            } else {
              set({ cartId: null, cartItems: [], lastUpdated: Date.now() });
            }
          } catch (error) {
            console.error("Failed to refresh cart data:", error);
            set({ cartId: null, cartItems: [], lastUpdated: Date.now() });
          }
        },

        getCartCount: () => {
          const state = get();
          return Array.isArray(state.cartItems) ? state.cartItems.length : 0;
        },

        forceUpdate: () => {
          set((state) => ({ ...state }));
        },
      };
    },
    {
      name: 'cart-storage', // unique name for localStorage key
      partialize: (state) => ({ 
        cartId: state.cartId, 
        cartItems: state.cartItems,
        lastUpdated: state.lastUpdated
      }), // only persist these fields
    }
  )
);
