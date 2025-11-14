import { z } from "zod";

export class CartValidation {
  static AddToCart() {
    return z.object({
      userId: z.string().min(1, "User ID is required"),
      items: z.array(
        z.object({
          productVariantId: z.string().min(1, "Product variant ID is required"),
          quantity: z.number().int().positive("Quantity must be positive")
        })
      ).min(1, "At least one item is required")
    });
  }
  static UpdateCartItem() {
    return z.object({
      id: z.string().min(1, "Cart item ID is required"), 
      cartId: z.string().optional(),
      productVariantId: z.string().min(1, "Product variant ID is required"), 
      quantity: z.number().int().positive("Quantity must be positive")
    });
  }

}
