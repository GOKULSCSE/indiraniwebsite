import { z } from "zod";
import { OrderItemStatus, OrderStatus, PaymentStatus } from "@prisma/client";

export class OrderValidation {
  static CreateOrder() {
    return z.object({
      userId: z.string().min(1, "User ID is required"),
      totalAmount: z.number().positive("Total amount must be positive"),
      orderStatus: z.nativeEnum(OrderStatus).optional(),
      paymentStatus: z.nativeEnum(PaymentStatus).optional(),
      shippingAddressId: z.string().min(1, "Shipping address ID is required"),
      createdAt: z.date().default(() => new Date()),
      updatedAt: z.date().default(() => new Date()),
      shippingCharges: z.number(),
      items: z
        .array(
          z.object({
            orderId: z.string().optional(),
            productVariantId: z
              .string()
              .min(1, "Product variant ID is required"),
            sellerId: z.string().min(1, "Seller ID is required"),
            quantity: z.number().int().positive("Quantity must be positive"),
            priceAtPurchase: z.number(),
            gstAmountAtPurchase: z.number(),
            gstAtPurches: z.number(),
            discountId: z.string().optional(),
            courierServiceId: z.number(),
            shippingCharge: z.number(),
            draftShipment: z.object({
              pickupLocationId: z.number(),
              courierServiceId: z.number(),
              shippingCharge: z.number(),
              shipmentStatus: z.enum(['draft', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']),
              AWB: z.string().optional(),
            }).optional(),
          })
        )
        .min(1, "At least one item is required"),
    });
  }

  static UpdateOrder() {
    return z.object({
      id: z.string().min(1, "Order ID is required"),
      orderStatus: z.nativeEnum(OrderStatus).optional(),
      paymentStatus: z.nativeEnum(PaymentStatus).optional(),
      shippingAddressId: z
        .string()
        .min(1, "Shipping address ID is required")
        .optional(),
    });
  }

  static GetOrders() {
    return z.object({
      userId: z.string().optional(),
      orderStatus: z.nativeEnum(OrderStatus).optional(),
      paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    });
  }

  static UpdateSellerOrderStatus() {
    return z.object({
      id: z.string().min(1, "Order Item ID is required"),
      status: z.enum([
        OrderItemStatus.pending,
        OrderItemStatus.shipped,
        OrderItemStatus.delivered,
        OrderItemStatus.cancelled,
      ]),
    });
  }

  static GetSellerOrderItems() {
    return z.object({
      search: z.string().optional(),
      sortBy: z.enum(["createdAt", "priceAtPurchase", "status"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      status: z
        .enum([
          "total",
          OrderItemStatus.pending,
          OrderItemStatus.shipped,
          OrderItemStatus.delivered,
          OrderItemStatus.cancelled,
          OrderItemStatus.cancellRequested
        ])
        .optional(),
      limit: z.number().min(1).max(100).optional().default(10),
      offset: z.number().min(0).optional().default(0),
    });
  }

  static CancellRequest() {
    return z.object({
      orderItemId: z.string().min(1, "Order item ID is required"),
      reason: z.string().min(1, "Reason is required"),
    });
  }

  static CancelOrderItem() {
    return z.object({
      orderItemId: z.string(),
      reason: z.string().optional(),
    });
  }
}
