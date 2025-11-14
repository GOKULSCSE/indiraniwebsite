import { z } from "zod";

export class WishlistValidation {
  static AddToWishlist() {
    return z.object({
      userId: z.string().min(1, "User ID is required"),
      items: z.array(
        z.object({
          productVariantId: z.string().min(1, "Product variant ID is required")
        })
      ).min(1, "At least one item is required")
    });
  }

  static RemoveFromWishlist() {
    return z.object({
      ids: z.array(z.string()).min(1, "At least one item ID is required")
    });
  }
} 