// store/wishlistStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  price: string;
  imageUrl?: string;
}

interface WishlistItem {
  id: string;
  productVariantId: string;
  wishlistId: string;
  productVariant: ProductVariant;
  createdAt?: string;
  updatedAt?: string;
}

interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  createdAt?: string;
  updatedAt?: string;
}

interface WishlistState {
  wishlist: Wishlist | null;
  isLoading: boolean;
  error: string | null;
  isFetched: boolean;
  lastUpdated: number | null;
  fetchWishlist: (userId: string, forceRefresh?: boolean) => Promise<void>;
  addToWishlist: (
    userId: string,
    productVariantId: string,
    productData?: Partial<ProductVariant>
  ) => Promise<WishlistItem | undefined>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  removeByVariantId: (variantId: string) => Promise<void>;
  checkInWishlist: (productVariantId: string) => boolean;
  getWishlistItem: (productVariantId: string) => WishlistItem | undefined;
  clearWishlistError: () => void;
  resetWishlist: () => void;
}

// Debugging function
const logStoreAction = (action: string, payload?: any) => {
  console.log(`[WishlistStore] ${action}`, payload);
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: null,
      isLoading: false,
      error: null,
      isFetched: false,
      lastUpdated: null,

      fetchWishlist: async (userId, forceRefresh = false) => {
        logStoreAction("fetchWishlist", { userId, forceRefresh });
        
        if (!userId) {
          set({ error: "User ID is required" });
          return;
        }

        const { isFetched, isLoading, lastUpdated } = get();
        
        if (isLoading) {
          logStoreAction("fetchWishlist - already loading");
          return;
        }

        const isStale = lastUpdated && Date.now() - lastUpdated > 300000;
        if (!forceRefresh && isFetched && !isStale) {
          logStoreAction("fetchWishlist - using cached data");
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await axios.get<{ data: Wishlist }>(`/api/user/wishlist`, {
            params: { userId },
            timeout: 10000,
          });

          logStoreAction("fetchWishlist - success", response.data);

          if (response.data?.data) {
            set({
              wishlist: response.data.data,
              isLoading: false,
              isFetched: true,
              lastUpdated: Date.now(),
              error: null,
            });
          } else {
            throw new Error("Invalid wishlist response format");
          }
        } catch (error) {
          logStoreAction("fetchWishlist - error", error);
          
          let errorMessage = "Failed to fetch wishlist";
          if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          set({
            error: errorMessage,
            isLoading: false,
            isFetched: false,
          });
        }
      },

      addToWishlist: async (userId, productVariantId, productData) => {
        logStoreAction("addToWishlist", { userId, productVariantId, productData });

        if (!userId || !productVariantId) {
          set({ error: "User ID and product variant ID are required" });
          throw new Error("Invalid parameters");
        }

        if (get().checkInWishlist(productVariantId)) {
          set({ error: "Item already in wishlist" });
          throw new Error("Item already in wishlist");
        }

        // Optimistic update
        const optimisticItem: WishlistItem = {
          id: `temp-${Date.now()}`,
          productVariantId,
          wishlistId: get().wishlist?.id || "temp-wishlist",
          productVariant: {
            id: productVariantId,
            productId: productData?.productId || "",
            title: productData?.title || "",
            price: productData?.price || "",
            imageUrl: productData?.imageUrl,
          },
        };

        const originalWishlist = get().wishlist;
        set({
          wishlist: originalWishlist
            ? {
                ...originalWishlist,
                items: [...originalWishlist.items, optimisticItem],
              }
            : {
                id: `temp-wishlist-${Date.now()}`,
                userId,
                items: [optimisticItem],
              },
          isLoading: true,
          error: null,
        });

        try {
          const response = await axios.post<{ data: Wishlist }>(
            "/api/user/wishlist",
            {
              userId,
              items: [
                {
                  productVariantId,
                  ...(productData && { productVariant: productData }),
                },
              ],
            },
            { timeout: 10000 }
          );

          logStoreAction("addToWishlist - success", response.data);

          const newItem = response.data?.data?.items?.find(
            (item) => item.productVariantId === productVariantId
          );

          set({
            wishlist: response.data?.data || null,
            isLoading: false,
            lastUpdated: Date.now(),
          });

          return newItem;
        } catch (error) {
          logStoreAction("addToWishlist - error", error);
          
          // Rollback
          set({
            wishlist: originalWishlist,
            isLoading: false,
            error: axios.isAxiosError(error)
              ? error.response?.data?.message || error.message
              : error instanceof Error
              ? error.message
              : "Failed to add to wishlist",
          });
          throw error;
        }
      },

      removeFromWishlist: async (itemId) => {
        logStoreAction("removeFromWishlist", { itemId });

        if (!itemId) {
          set({ error: "Item ID is required" });
          throw new Error("Invalid item ID");
        }

        const originalWishlist = get().wishlist;
        set({
          wishlist: originalWishlist
            ? {
                ...originalWishlist,
                items: originalWishlist.items.filter((item) => item.id !== itemId),
              }
            : null,
          isLoading: true,
          error: null,
        });

        try {
          await axios.delete(`/api/user/wishlist/item/${itemId}`, {
            timeout: 10000,
          });

          logStoreAction("removeFromWishlist - success");

          set({
            isLoading: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          logStoreAction("removeFromWishlist - error", error);
          
          // Rollback
          set({
            wishlist: originalWishlist,
            isLoading: false,
            error: axios.isAxiosError(error)
              ? error.response?.data?.message || error.message
              : error instanceof Error
              ? error.message
              : "Failed to remove from wishlist",
          });
          throw error;
        }
      },

      removeByVariantId: async (variantId) => {
        logStoreAction("removeByVariantId", { variantId });
        const item = get().getWishlistItem(variantId);
        if (item) await get().removeFromWishlist(item.id);
      },

      checkInWishlist: (productVariantId) => {
        return !!get().getWishlistItem(productVariantId);
      },

      getWishlistItem: (productVariantId) => {
        const { wishlist } = get();
        return wishlist?.items?.find(
          (item) => item.productVariantId === productVariantId
        );
      },

      clearWishlistError: () => {
        set({ error: null });
      },

      resetWishlist: () => {
        logStoreAction("resetWishlist");
        set({
          wishlist: null,
          isFetched: false,
          isLoading: false,
          error: null,
          lastUpdated: null,
        });
      },
    }),
    {
      name: "wishlist-storage",
      partialize: (state) => ({
        wishlist: state.wishlist,
        isFetched: state.isFetched,
        lastUpdated: state.lastUpdated,
      }),
      version: 1,
    }
  )
);

// Helper hook
export const useWishlistStatus = (productVariantId?: string) => {
  const { wishlist, checkInWishlist, isLoading } = useWishlistStore();
  return {
    isInWishlist: productVariantId ? checkInWishlist(productVariantId) : false,
    isLoading,
    wishlist,
  };
};