import db from "../../lib/db";
import _ from "lodash";
import { IOrder, Order } from "../models/Order";
import {
  OrderItemStatus,
  PaymentGatewayStatus,
  PaymentStatus,
  PaymentType,
  RefundStatus,
} from "@prisma/client";
import { mail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/mail/templates/order-confirmation-template";
import { razorpay } from "@/lib/razorpay";
import { ShiprocketService } from "@/modules/services/shiprocketservice";
import { SHIPMENT_STATUS_CODES } from "@/utils/constants";

export class OrderService {
  async CreateOrder(orderData: IOrder) {
    const order = new Order(orderData);

    console.log("Creating order with data:", order);

    const orderdetails = await db.order.create({
      data: {
        userId: order.userId,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentRefId: order.paymentRefId,
        paymentStatus: order.paymentStatus,
        shippingAddressId: order.shippingAddressId,
        items: {
          create: order.items.map((item) => ({
            productVariantId: item.productVariantId,
            sellerId: item.sellerId,
            userId: item.userId,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
            gstAmountAtPurchase: item.gstAmountAtPurchase || 0,
            discountAmountAtPurchase: item.discountAmountAtPurchase || 0,
            status: item.status,
            courierServiceId: item.courierServiceId,
            shippingCharge: item.shippingCharge,
            trackings: item.trackings
              ? {
                  createMany: {
                    data: item.trackings,
                  },
                }
              : {
                  create: [
                    {
                      status: OrderItemStatus.pending,
                      remarks: "Order created",
                    },
                  ],
                },
          })),
        },
      },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
                ProductVariantImage: true,
                discounts: true,
              },
            },
            OrderTracking: true,
            seller: true,
            User: true,
          },
        },
        shippingAddress: true,
        user: true,
        payments: true,
      },
    });

    // Create payment record if payment reference exists
    if (order.paymentRefId) {
      const paymentRecord = await db.payment.create({
        data: {
          orderId: orderdetails.id,
          paymentGateway: "razorpay",
          paymentStatus: PaymentGatewayStatus.pending,
          paymentGatewayOrderId: order.paymentRefId,
          amount: order.totalAmount,
          paymentDate: new Date(),
        },
      });

      // Create payment records for each order item
      for (const item of order.items) {
        await db.orderItemPayment.create({
          data: {
            id: `${item.productVariantId}_${paymentRecord.id}`,
            orderItemId: item.productVariantId,
            paymentId: paymentRecord.id,
            amount: Number(item.priceAtPurchase) + Number(item.shippingCharge),
            paymentStatus: PaymentGatewayStatus.pending,
            paymentType: PaymentType.purchase,
          },
        });
      }
    }

    // console.log(orderdetails)
    // await mail.sendMail({to:orderdetails.user.email,subject:"Order Confirmation",template:generateOrderConfirmationEmail(orderdetails)})
    return orderdetails;
  }

  async GetOrders({ userId }: { userId: string }) {
    return await db.order.findMany({
      where: {
        ...(userId && { userId }),
      },
      include: {
        payments: true,
        items: {
          include: {
            OrderTracking: true,
            productVariant: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
                ProductVariantImage: true,
                discounts: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    });
  }

  async GetOrderItems({ userId }: { userId: string }) {
    const orderItems = await db.orderItem.findMany({
      where: {
        ...(userId && { userId }),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        order: { 
          select: { 
            shippingAddress: true, 
            paymentStatus: true,
            paymentRefId: true,
            createdAt: true,
            updatedAt: true,
            orderRefId: true
          } 
        },
        productVariant: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            ProductVariantImage: true,
            discounts: true,
          },
        },
        OrderTracking: true,
        seller: {
          select: {
            storeName: true
          }
        },
        shipment: {
          select: {
            AWB: true,
            shipmentStatus: true
          }
        }
      },
    });

    // Group order items by paymentRefId (which groups items from the same order)
    const groupedOrders = orderItems.reduce((groups, item) => {
      const paymentRefId = item.order.paymentRefId || 'no-payment';
      
      if (!groups[paymentRefId]) {
        groups[paymentRefId] = {
          paymentRefId: paymentRefId,
          orderRefId: item.order.orderRefId,
          createdAt: item.order.createdAt,
          updatedAt: item.order.updatedAt,
          paymentStatus: item.order.paymentStatus,
          shippingAddress: item.order.shippingAddress,
          items: []
        };
      }
      
      groups[paymentRefId].items.push(item);
      return groups;
    }, {} as Record<string, any>);

    // Convert grouped orders to array and sort by creation date
    return Object.values(groupedOrders).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async GetOrderDetailsById({ id }: { id: string }) {
    // First, get the order to find its paymentRefId
    const order = await db.order.findUnique({
      where: { id },
      select: { paymentRefId: true }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Then fetch all orders with the same paymentRefId (all orders created together)
    return await db.order.findMany({
      where: {
        paymentRefId: order.paymentRefId,
      },
      include: {
        user: true,
        payments: true,
        items: {
          include: {
            OrderTracking: true,
            productVariant: {
              include: {
                product: {
                  include: {
                    images: true,
                    seller: {
                      select: {
                        storeName: true
                      }
                    }
                  },
                },
                ProductVariantImage: true,
                discounts: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async GetOrderItemTrackings({ id }: { id: string }) {
    console.log("id : ", id);
    return await db.orderItem.findUnique({
      where: {
        id,
      },
      include: {
        OrderTracking: true,
        productVariant: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            ProductVariantImage: true,
            discounts: true,
          },
        },
      },
    });
  }

  async CancellRequest({ id, reason }: { id: string; reason: string }) {
    const orderItemDetails = await db.orderItem.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!orderItemDetails) {
      throw new Error("Order item not found");
    }

    if (orderItemDetails.status === OrderItemStatus.cancelled) {
      throw new Error("Order item is already cancelled");
    }

    const orderItem = await db.orderItem.update({
      where: { id: orderItemDetails.id },
      data: {
        status: OrderItemStatus.cancellRequested,
        cancellationReason: reason,
      },
    });

    return orderItem;
  }

  async CancelOrderItem({
    id,
    cancelType,
    refundAmount,
  }: {
    id: string;
    cancelType: "withRefund" | "withoutRefund";
    refundAmount?: number;
  }) {
    const orderItem = await db.orderItem.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true,
            payments: { include: { orderItemPayments: true } },
          },
        },
        shipment: { include: { shipmentItems: true } },
      },
    });

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    if (orderItem.status === OrderItemStatus.cancelled) {
      throw new Error("Order item is already cancelled");
    }

    if (cancelType === "withRefund" && !refundAmount) {
      throw new Error("Refund amount is required");
    }
    if (
      cancelType === "withRefund" &&
      refundAmount &&
      Number(refundAmount) > Number(orderItem.priceAtPurchase)
    ) {
      throw new Error("Refund amount is greater than order item price");
    }

    if (cancelType === "withRefund") {
      if (!orderItem.order.payments[0].transactionId) {
        throw new Error("Transaction ID not found");
      }

      const razorpayRefund = await razorpay.payments.refund(
        orderItem.order.payments[0].transactionId!,
        {
          amount: Math.round(Number(refundAmount) * 100),
          speed: "normal",
        }
      );
      console.log("Razorpay refund:", razorpayRefund);

      await db.orderItem.update({
        where: { id },
        data: {
          isRefunded: razorpayRefund.status === "processed" ? true : false,
          refundId: razorpayRefund.id,
          refundedAmount: Number(refundAmount),
          refundStatus: razorpayRefund.status as RefundStatus,
          status: OrderItemStatus.cancelled,
        },
      });
    } else if (cancelType === "withoutRefund") {
      await db.orderItem.update({
        where: { id },
        data: {
          status: OrderItemStatus.cancelled,
        },
      });
    }

    if (orderItem.shipment?.orderId) {
      const shiprocketService = ShiprocketService.getInstance();
      const cancelOrderResponse = await shiprocketService.cancelOrder([
        orderItem.shipment.orderId,
      ]);
      console.log("Shiprocket cancel order response:", cancelOrderResponse);
      await db.shipments.update({
        where: { id: orderItem.shipment.id },
        data: {
          shipmentStatus: SHIPMENT_STATUS_CODES[5].shipmentStatus,
          statusCode: SHIPMENT_STATUS_CODES[5].statusCode,
        },
      });
    }

    return orderItem;
  }

  async GetSellerOrderItems({ sellerId }: { sellerId: string }) {
    return await db.orderItem.findMany({
      where: {
        ...(sellerId && { sellerId }),
      },
      include: {
        OrderTracking: true,
        productVariant: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        order: {
          select: {
            paymentStatus: true,
            orderStatus: true,
            shippingAddress: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async GetSellerOrderItemDetails({ id }: { id: string }) {
    return await db.orderItem.findUnique({
      where: {
        id,
      },
      include: {
        OrderTracking: true,
        productVariant: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        order: {
          select: {
            paymentStatus: true,
            orderStatus: true,
            shippingAddress: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async UpdateSellerOrderStatus({
    id,
    status,
  }: {
    id: string;
    status?: OrderItemStatus;
  }) {
    const orderItem = await db.orderItem.findUnique({
      where: { id },
      include: { OrderTracking: true },
    });

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    await db.orderItem.update({
      where: { id: orderItem.id },
      data: {
        status: status,
      },
    });

    await db.orderTracking.create({
      data: {
        orderItemId: id,
        status: status,
        remarks: `Status updated to ${status}`,
      },
    });

    return await db.orderItem.findUnique({
      where: { id },
      include: {
        OrderTracking: true,
        productVariant: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        order: {
          select: {
            paymentStatus: true,
            orderStatus: true,
            shippingAddress: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getSellerOrderItems({
    sellerId,
    filters,
  }: {
    sellerId: string;
    filters: {
      search?: string;
      sortBy?: "createdAt" | "priceAtPurchase" | "status";
      sortOrder?: "asc" | "desc";
      startDate?: Date;
      endDate?: Date;
      status?: "total" | OrderItemStatus;
      limit: number;
      offset: number;
    };
  }) {
    try {
      //  where clause
      const where: any = {
        sellerId,
      };

      //  date range filter
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      //  status filter (support cancellRequested)
      if (filters.status && filters.status !== "total") {
        where.status = filters.status as OrderItemStatus;
      }

      //  global search filter
      if (filters.search) {
        where.OR = [
          { id: { contains: filters.search, mode: "insensitive" } },
          { order: { id: { contains: filters.search, mode: "insensitive" } } },
          {
            productVariant: {
              title: { contains: filters.search, mode: "insensitive" },
            },
          },
          {
            productVariant: {
              productVariantSKU: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
          {
            productVariant: {
              product: {
                name: { contains: filters.search, mode: "insensitive" },
                productSKU: { contains: filters.search, mode: "insensitive" },
              },
            },
          },
        ];
      }

      // Get total count for each status
      const counts = await db.orderItem.groupBy({
        by: ["status"],
        where: {
          sellerId,
        },
        _count: true,
      });

      // Get paginated order items
      const orderItems = await db.orderItem.findMany({
        where,
        include: {
          order: {
            include: {
              shippingAddress: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          OrderItemPayment: { include: { payment: true } },
          productVariant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productSKU: true,
                  images: true,
                },
              },
              ProductVariantImage: true,
              discounts: true,
            },
          },
          OrderTracking: {
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        orderBy: filters.sortBy
          ? {
              [filters.sortBy]: filters.sortOrder || "desc",
            }
          : {
              createdAt: "desc",
            },
        take: filters.limit,
        skip: filters.offset,
      });

      // Add formattedOrderId to each order item
      // Get all order items for this seller to maintain persistent numbering
      const allSellerOrderItems = await db.orderItem.findMany({
        where: { sellerId },
        select: { id: true, orderId: true },
        orderBy: { createdAt: "asc" }, // Order by creation date to maintain sequence
      });

      // Create persistent sequential numbering starting from 100
      const orderItemMap = new Map<string, number>();
      const orderItemSequentialMap = new Map<string, string>();
      const uniqueOrderMap = new Map<string, number>();
      let orderCounter = 100; // Start from 100

      // Calculate sequential numbering for ALL order items (not just current page)
      allSellerOrderItems.forEach((item) => {
        const orderId = item.orderId;
        
        // Get or assign unique order number
        if (!uniqueOrderMap.has(orderId)) {
          uniqueOrderMap.set(orderId, orderCounter);
          orderCounter++;
        }
        const uniqueOrderNumber = uniqueOrderMap.get(orderId)!;
        
        // Get sequential item number within this order
        const currentCount = orderItemMap.get(orderId) || 0;
        const sequentialNumber = currentCount + 1;
        orderItemMap.set(orderId, sequentialNumber);
        
        // Store the formatted order ID for each item
        const formattedOrderId = `${uniqueOrderNumber}-${sequentialNumber}`;
        orderItemSequentialMap.set(item.id, formattedOrderId);
      });

      const orderItemsWithFormattedId = orderItems.map((item) => {
        const formattedOrderId = orderItemSequentialMap.get(item.id) || `100-1`;
        
        return {
          ...item,
          formattedOrderId,
        };
      });

      // Format counts (add cancellRequested)
      const formattedCounts = {
        total: counts.reduce((acc, curr) => acc + curr._count, 0),
        pending:
          counts.find((c) => c.status === OrderItemStatus.pending)?._count || 0,
        shipped:
          counts.find((c) => c.status === OrderItemStatus.shipped)?._count || 0,
        delivered:
          counts.find((c) => c.status === OrderItemStatus.delivered)?._count ||
          0,
        cancelled:
          counts.find((c) => c.status === OrderItemStatus.cancelled)?._count ||
          0,
        cancellRequested:
          counts.find((c) => c.status === OrderItemStatus.cancellRequested)
            ?._count || 0,
      };

      return {
        count: formattedCounts,
        orderItems: orderItemsWithFormattedId,
      };
    } catch (error: any) {
      throw {
        message: error.message || "Failed to get seller order items",
        status: 500,
      };
    }
  }

  async cancelAndRefundOrderItem({
    orderItemId,
    cancelledBy,
    reason,
  }: {
    orderItemId: string;
    cancelledBy: "user" | "seller";
    reason?: string;
  }) {
    const orderItem = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    if (orderItem.status === OrderItemStatus.cancelled) {
      throw new Error("Order item is already cancelled");
    }

    const orderItemPayment = await db.orderItemPayment.findFirst({
      where: {
        orderItemId: orderItemId,
        paymentType: PaymentType.purchase,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!orderItemPayment) {
      throw new Error("Payment not found for order item");
    }

    const payment = await db.payment.findUnique({
      where: { id: orderItemPayment.paymentId },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update order item status
    await db.orderItem.update({
      where: { id: orderItemId },
      data: { status: OrderItemStatus.cancelled },
    });

    const refundAmount = Number(orderItemPayment.amount);

    if (refundAmount > 1) {
      if (!payment.transactionId) {
        throw new Error("Payment transaction ID not found");
      }
      // Process refund through Razorpay
      const refund = await razorpay.payments.refund(payment.transactionId, {
        amount: Math.round(refundAmount * 100), // Convert to paisa
        speed: "normal",
      });

      // Create refund record
      await db.orderItemPayment.create({
        data: {
          id: `${orderItemId}_${payment.id}_refund`,
          orderItemId: orderItemId,
          paymentId: payment.id,
          amount: refundAmount,
          paymentStatus: PaymentGatewayStatus.completed,
          paymentType: PaymentType.refund,
          reason: reason,
        },
      });
    } else {
      // Create manual refund record for small amounts
      await db.orderItemPayment.create({
        data: {
          id: `${orderItemId}_${payment.id}_refund_manual`,
          orderItemId: orderItemId,
          paymentId: payment.id,
          amount: refundAmount,
          paymentStatus: PaymentGatewayStatus.completed,
          paymentType: PaymentType.refund,
          reason: `Manual refund: ${
            reason || "Amount less than minimum refund threshold"
          }`,
        },
      });
    }

    return await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
        productVariant: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });
  }

  async createShiprocketOrder(orderDetails: any, shippingAddress: any) {
    try {
      const shiprocketPayload = {
        order_id: orderDetails.id,
        order_date: new Date()
          .toISOString()
          .split("T")
          .join(" ")
          .substring(0, 16),
        pickup_location: "gandhipuram_123", // This should be configured based on seller's pickup location
        billing_customer_name:
          shippingAddress.firstName ||
          shippingAddress.name?.split(" ")[0] ||
          "",
        billing_last_name:
          shippingAddress.lastName || shippingAddress.name?.split(" ")[1] || "",
        billing_address: shippingAddress.street,
        billing_address_2: "",
        billing_city: shippingAddress.city,
        billing_pincode: shippingAddress.zipCode,
        billing_state: shippingAddress.state,
        billing_country: shippingAddress.country,
        billing_email: orderDetails.user.email,
        billing_phone: shippingAddress.phone || "",
        shipping_is_billing: true,
        order_items: orderDetails.items.map((item: any) => ({
          name: item.productVariant.product.name,
          sku: item.productVariant.productVariantSKU,
          units: item.quantity,
          selling_price: Number(item.priceAtPurchase),
          discount: Number(item.discountAmountAtPurchase) || 0,
          tax: Number(item.gstAmountAtPurchase) || 0,
          hsn: item.productVariant.hsnCode || 441122,
        })),
        payment_method: "Prepaid",
        shipping_charges: orderDetails.items.reduce(
          (total: number, item: any) =>
            total + Number(item.shippingCharge || 0),
          0
        ),
        sub_total: Number(orderDetails.totalAmount),
        length: 10,
        breadth: 15,
        height: 20,
        weight: 2.5, // This should be calculated based on items
      };

      // Use ShiprocketService directly
      const shiprocketService = ShiprocketService.getInstance();
      const shiprocketResponse = await shiprocketService.createOrder(
        shiprocketPayload
      );

      // Update order with Shiprocket details
      const updatedOrder = await db.order.update({
        where: { id: orderDetails.id },
        data: {
          items: {
            update: orderDetails.items.map((item: any) => ({
              where: { id: item.id },
              data: {
                shipment: {
                  create: {
                    pickupLocationId: parseInt(
                      shiprocketPayload.pickup_location.split("_")[1]
                    ),
                    shipmentId: shiprocketResponse.shipment_id,
                    orderId: shiprocketResponse.order_id,
                    courierServiceId: item.courierServiceId || 0,
                    shippingCharge: item.shippingCharge || 0,
                    AWB: shiprocketResponse.awb_code || "",
                  },
                },
              },
            })),
          },
        },
        include: {
          items: {
            include: {
              shipment: true,
              productVariant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      return {
        shiprocket: shiprocketResponse,
        order: updatedOrder,
      };
    } catch (error) {
      console.error("Error creating Shiprocket order:", error);
      throw error;
    }
  }
}
