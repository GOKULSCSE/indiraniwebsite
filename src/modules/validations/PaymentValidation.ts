import { z } from "zod";

export class PaymentValidation {
  static GetSellerPayments() {
    return z.object({
      search: z.string().optional(),
      sortBy: z
        .enum(["createdAt", "amount", "paymentStatus", "orderItemId"])
        .optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      status: z
        .enum(["total", "paid", "refunded"])
        .optional(),
      limit: z.number().min(1).max(100).optional().default(10),
      offset: z.number().min(0).optional().default(0),
    });
  }
}
