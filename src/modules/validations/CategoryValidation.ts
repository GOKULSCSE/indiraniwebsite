import { z } from "zod";

export class CategoryValidation {
  static CreateCategory() {
    return z.object({
      name: z.string().min(1, "Category name is required"),
      description: z.string().optional(),
      parentCategoryId: z.string().optional(),
      imageUrl: z.string().optional(),
    });
  }

  static UpdateCategory() {
    return z.object({
      id: z.string().min(1, "Category ID is required"),
      name: z.string().min(1, "Category name is required"),
      description: z.string().optional(),
      parentCategoryId: z.string().optional(),
      imageUrl: z.string().optional(),
    });
  }
}
