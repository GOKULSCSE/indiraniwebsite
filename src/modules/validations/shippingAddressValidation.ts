import { z } from "zod";

export class ShippingAddressValidation {
  static CreateShippingAddress() {
    return z.object({
      userId: z.string().min(1, "User ID is required"),
      fullName: z.string().optional(),
      email: z.string().email("Invalid email address").optional(),
      street: z.string().min(1, "Street address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      zipCode: z.string().min(1, "Zip code is required"),
      country: z.string().min(1, "Country is required"),
      phone: z.string().optional(),
      landmark: z.string().optional()
    });
  }

  static UpdateShippingAddress() {
    return z.object({
      id: z.string().min(1, "Shipping address ID is required"),
      userId: z.string().min(1, "User ID is required"),
      fullName: z.string().optional(),
      email: z.string().email("Invalid email address").optional(),
      street: z.string().min(1, "Street address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      zipCode: z.string().min(1, "Zip code is required"),
      country: z.string().min(1, "Country is required"),
      phone: z.string().optional(),
      landmark: z.string().optional()
    });
  }
}
