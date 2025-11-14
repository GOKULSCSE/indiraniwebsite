import { z } from "zod";

export class UserValidation {
  static RegisterUser() {
    return z.object({
      name: z.string().min(1,"Name Required"),
      email: z.string().email(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[\W_]/, "Password must contain at least one special character"),
    });
  }

  static UpdateUserProfile() {
    return z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      name: z.string().optional(),
      profile: z.string().optional(),
      email: z.string().email().optional(),
      companyName: z.string().optional(),
      gstid: z.string().optional(),
      // phone: z.string().optional(),
      // country: z.string().optional()
    });
  }
}
