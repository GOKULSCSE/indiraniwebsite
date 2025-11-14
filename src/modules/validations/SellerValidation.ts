import { z } from "zod";

export class SellerValidation {
  static RegisterSeller() {
    return z.object({
      userId: z.string().min(1, "User ID is required"),
      storeName: z.string().min(1, "Store name is required"),
      storeDescription: z.string().optional(),
      upiId: z.string().optional(),
      address: z.string().min(1, "Address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      pincode: z.string().min(1, "Pincode is required"),
      country: z.string().default("India"),
      mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
      alternateMobileNumber: z.string().min(10, "Alternate mobile number must be at least 10 digits").optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      accountHolderName: z.string().min(1, "Account holder name is required"),
      accountNumber: z.string(),
      bankName: z.string().min(1, "Bank name is required"),
      ifscCode: z.string(),
      branchName: z.string().optional(),
      accountType: z.string(),
      gstNumber: z.string().min(15, "GST number must be 15 characters").optional(),
      agreeTerms: z
        .boolean()
        .refine((val) => val === true, "You must agree to the terms and conditions")
    });
  }

  static UpdateSellerProfile() {
    return z.object({
      storeName: z.string().min(1, "Store name is required").optional(),
      storeDescription: z.string().optional(),
      upiId: z.string().optional(),
      gstNumber: z.string().optional(),
      address: z.string().min(1, "Address is required").optional(),
      city: z.string().min(1, "City is required").optional(),
      state: z.string().min(1, "State is required").optional(),
      pincode: z.string().min(1, "Pincode is required").optional(),
      country: z.string().optional(),
      mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits").optional(),
      alternateMobileNumber: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      user: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        name: z.string().optional(),
        profile: z.string().optional(),
      }).optional(),
    });
  }

  static UpdateBankInfo() {
    return z.object({
      accountHolderName: z.string().min(1, "Account holder name is required").optional(),
      accountNumber: z.string().optional(),
      bankName: z.string().min(1, "Bank name is required").optional(),
      ifscCode: z.string().optional(),
      branchName: z.string().optional(),
      accountType: z.string().optional(),
    });
  }

  static CreateGST() {
    return z.object({
      type: z.string().min(1, "GST type is required"),
      percentage: z.number().min(0, "Percentage must be greater than or equal to 0"),
    });
  }

  static UpdateGST() {
    return z.object({
      type: z.string().min(1, "GST type is required").optional(),
      percentage: z.number().min(0, "Percentage must be greater than or equal to 0").optional(),
    });
  }
} 