import { z } from "zod";

export class ReviewValidation {
  static CreateReview() {
    return z.object({
      productId: z.string().min(1, "Product ID is required"),
      userId: z.string().min(1, "User ID is required"),
      rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
      reviewText: z.string().optional()
    });
  }
}
