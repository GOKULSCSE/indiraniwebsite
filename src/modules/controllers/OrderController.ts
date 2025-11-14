import { NextResponse } from "next/server";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { OrderService } from "../services/OrderService";
import { z } from "zod";
import { OrderValidation } from "../validations/OrderValidation";
import { SessionUser } from "../../../types/next-auth";
import { razorpay } from "@/lib/razorpay";
import db from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { OrderStatus, PaymentStatus, OrderItemStatus } from "@prisma/client";

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  async CreateOrder(request: Request) {
    try {
      const body = await request.json();

      const validatedData = OrderValidation.CreateOrder().parse(body);

      const productVariantIds = validatedData.items.map(
        (item) => item.productVariantId
      );

      // Fetch product variants with their prices
      const productVariants = await db.productVariant.findMany({
        where: {
          id: {
            in: productVariantIds,
          },
        },
        select: {
          id: true,
          price: true,
        },
      });

      // Fetch all discount records (only for non-empty discount IDs)
      const validDiscountIds = validatedData.items
        .map(item => item.discountId)
        .filter((id): id is string => id !== undefined && id !== "");

      const discountRecords = validDiscountIds.length > 0 ? await db.productDiscount.findMany({
        where: {
          id: {
            in: validDiscountIds
          }
        }
      }) : [];

      const priceMap = new Map();
      const discountMap = new Map();

      // Create maps for easy lookup
      productVariants.forEach((variant) => {
        priceMap.set(variant.id, variant.price);
      });

      discountRecords.forEach((discount) => {
        discountMap.set(discount.id, discount);
      });

      const itemsWithCalculatedPrices = validatedData.items.map((item) => {
        const variantPrice = priceMap.get(item.productVariantId);
        if (!variantPrice) {
          throw new Error(`Product variant not found: ${item.productVariantId}`);
        }

        const basePrice = Number(item.priceAtPurchase) * item.quantity;
        let discountAmount = 0;

        // Calculate discount if discount record exists and is valid
        if (item.discountId && item.discountId.length > 0) {
          const discount = discountMap.get(item.discountId);
          if (discount) {
            const today = new Date();
            if (today >= discount.startDate && today <= discount.endDate) {
              if (discount.discountType === 'percentage') {
                discountAmount = Number((basePrice * Number(discount.discountValue) / 100).toFixed(2));
              } else {
                discountAmount = Number(discount.discountValue);
              }
            }
          }
        }

        // Create draft shipment data separately
        const draftShipmentData = item.draftShipment ? {
          pickupLocationId: item.draftShipment.pickupLocationId,
          courierServiceId: item.draftShipment.courierServiceId,
          shippingCharge: item.draftShipment.shippingCharge,
          shipmentStatus: item.draftShipment.shipmentStatus,
          AWB: item.draftShipment.AWB || "",
        } : undefined;

        return {
          productVariantId: item.productVariantId,
          sellerId: item.sellerId,
          userId: validatedData.userId,
          quantity: item.quantity,
          priceAtPurchase: basePrice,
          gstAmountAtPurchase: item.gstAmountAtPurchase,
          gstAtPurches: item.gstAtPurches,
          discountAmountAtPurchase: discountAmount,
          status: OrderItemStatus.pending,
          courierServiceId: item.courierServiceId,
          shippingCharge: Number(item.shippingCharge),
          draftShipmentsId: undefined, // This will be set after creating the draft shipment
          draftShipmentData // Store the draft shipment data for later use
        };
      });

      // Group items by sellerId
      const itemsBySeller = itemsWithCalculatedPrices.reduce((groups, item) => {
        const sellerId = item.sellerId;
        if (!groups[sellerId]) {
          groups[sellerId] = [];
        }
        groups[sellerId].push(item);
        return groups;
      }, {} as Record<string, typeof itemsWithCalculatedPrices>);

      console.log("Items grouped by seller:", Object.keys(itemsBySeller).length, "sellers");

      // Calculate total item value (without shipping) for proportional shipping distribution
      const totalItemValue = itemsWithCalculatedPrices.reduce((total, item) => {
        const itemTotal = Number(item.priceAtPurchase) * item.quantity;
        const gstAmount = Number(item.gstAmountAtPurchase || 0) * item.quantity;
        return total + itemTotal + gstAmount;
      }, 0);

      // Use the total shipping charges from the request for proper distribution
      const totalShippingCharges = validatedData.shippingCharges || 0;
      
      // Calculate grand total amount (items + shipping)
      const grandTotalAmount = totalItemValue + totalShippingCharges;

      // Create one combined Razorpay order for the total amount
      const combinedTimestamp = Date.now().toString().slice(-8); // Last 8 digits for uniqueness
      const combinedReceipt = `rcpt_combined_${combinedTimestamp}`; // Format: rcpt_combined_12345678 (max ~25 chars)
      
      const combinedPaymentOptions = {
        amount: Math.round(grandTotalAmount * 100), // Total amount for all sellers (includes shipping)
        currency: "INR",
        receipt: combinedReceipt,
      };

      console.log(`Creating combined Razorpay order for total amount:`, JSON.stringify(combinedPaymentOptions, null, 2));
      const combinedRazorpayOrder = await razorpay.orders.create(combinedPaymentOptions);
      console.log(`Combined Razorpay order created:`, JSON.stringify(combinedRazorpayOrder, null, 2));

      // Create separate database orders for each seller
      const createdOrders = [];

      // Create a mapping for shorter seller identifiers
      const sellerIndexMap = new Map();
      let sellerIndex = 1;
      
      for (const sellerId of Object.keys(itemsBySeller)) {
        sellerIndexMap.set(sellerId, sellerIndex);
        sellerIndex++;
      }

      for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
        // Calculate seller's item total (without shipping)
        const sellerItemTotal = sellerItems.reduce((total, item) => {
          const itemTotal = Number(item.priceAtPurchase) * item.quantity;
          const gstAmount = Number(item.gstAmountAtPurchase || 0) * item.quantity;
          return total + itemTotal + gstAmount;
        }, 0);

        // Calculate proportional shipping charge (with proper rounding)
        const sellerShippingCharge = totalItemValue > 0 
          ? Math.round(((sellerItemTotal / totalItemValue) * totalShippingCharges) * 100) / 100
          : 0;

        // Calculate total amount for this seller
        const sellerTotalAmount = Math.round((sellerItemTotal + sellerShippingCharge) * 100) / 100;

        console.log(`Seller ${sellerId} calculation:`, {
          itemTotal: sellerItemTotal,
          shippingCharge: sellerShippingCharge,
          totalAmount: sellerTotalAmount
        });

        // Get seller name
        const sellerProfile = await db.sellerProfile.findUnique({
          where: { id: sellerId },
          select: { storeName: true }
        });

        try {
          // First create the draft shipments for this seller's items
          const draftShipments = await Promise.all(
            sellerItems
              .filter(item => item.draftShipmentData)
              .map(async (item) => {
                const draftShipment = await db.draftShipments.create({
                  data: item.draftShipmentData!
                });
                return { orderItemIndex: sellerItems.indexOf(item), draftShipmentId: draftShipment.id };
              })
          );

          // Update the seller's items with draft shipment IDs
          const itemsWithDraftShipments = sellerItems.map((item, index) => {
            const draftShipment = draftShipments.find(ds => ds.orderItemIndex === index);
            return {
              ...item,
              draftShipmentsId: draftShipment?.draftShipmentId,
              draftShipmentData: undefined // Remove the temporary data
            };
          });

          // Create the order for this seller using the combined payment reference
          const dbOrder = await db.order.create({
            data: {
              userId: validatedData.userId,
              totalAmount: sellerTotalAmount,
              orderStatus: OrderStatus.pending,
              paymentRefId: combinedRazorpayOrder.id, // Use combined order ID
              orderRefId: combinedRazorpayOrder.id,   // Use combined order ID
              paymentStatus: PaymentStatus.pending,
              shippingAddressId: validatedData.shippingAddressId,
              items: {
                create: itemsWithDraftShipments
              }
            },
            include: {
              items: {
                include: {
                  DraftShipments: true,
                  productVariant: {
                    include: {
                      product: {
                        include: {
                          seller: {
                            select: {
                              storeName: true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              user: {
                select: {
                  email: true
                }
              }
            }
          });

          createdOrders.push({
            dbOrder,
            sellerId,
            sellerName: sellerProfile?.storeName || 'Unknown Store',
            itemCount: sellerItems.length,
            totalAmount: sellerTotalAmount,
            combinedPaymentId: combinedRazorpayOrder.id, // Reference to combined payment
          });

        } catch (error) {
          console.error(`Error creating order for seller ${sellerId}:`, error);
          throw error;
        }
      }

      // Verify total amount across all orders matches our calculation
      const calculatedTotal = createdOrders.reduce((total, order) => total + order.totalAmount, 0);
      console.log(`Verification: calculated total ${calculatedTotal}, expected total ${grandTotalAmount}`);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          {
            orders: createdOrders.map(order => ({
              orderId: order.dbOrder.id,
              sellerId: order.sellerId,
              sellerName: order.sellerName,
              itemCount: order.itemCount,
              totalAmount: order.totalAmount,
              razorpayOrderId: order.combinedPaymentId,
              razorpayAmount: order.totalAmount,
              razorpayCurrency: "INR",
            })),
            summary: {
              totalOrders: createdOrders.length,
              totalSellers: Object.keys(itemsBySeller).length,
              grandTotalAmount,
              totalItems: validatedData.items.length
            },
            // Keep the first order's details for backward compatibility with existing payment flow
            ...combinedRazorpayOrder,
            calculatedTotalAmount: grandTotalAmount,
            db_order_id: createdOrders[0].dbOrder.id,
            // Add all order IDs for payment verification
            all_order_ids: createdOrders.map(order => order.dbOrder.id),
          },
          `Successfully created ${createdOrders.length} orders for ${Object.keys(itemsBySeller).length} sellers`
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetOrders(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user = userData ? (JSON.parse(userData) as SessionUser) : null;

      if (!user) {
        throw new Error("Unauthorized - User ID is required");
      }

      const searchParams = new URL(request.url).searchParams;
      const params = Object.fromEntries(searchParams);
      const Filters = OrderValidation.GetOrders().parse(params); 

      const orders = await this.orderService.GetOrders({
        userId: user?.id,
        ...Filters,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          orders,
          "Orders Fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetOrderItems(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user = userData ? (JSON.parse(userData) as SessionUser) : null;

      if (!user) {
        throw new Error("Unauthorized - User ID is required");
      }

      const orders = await this.orderService.GetOrderItems({
        userId: user?.id,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          orders,
          "Orders Fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetOrderDetailsById(id: string) {
    try {
      const orders = await this.orderService.GetOrderDetailsById({ id });

      if (!orders || orders.length === 0) {
        throw new Error("Order not found");
      }

      // Console log for debugging - BEFORE combining orders
      console.log("=== ORDER CONTROLLER DEBUG - BEFORE COMBINING ===");
      console.log("Number of orders found:", orders.length);
      orders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`, {
          id: order.id,
          totalAmount: order.totalAmount,
          itemsCount: order.items.length,
          paymentRefId: order.paymentRefId
        });
      });
      console.log("=== END BEFORE COMBINING ===");

      // Combine all orders into a single response
      const firstOrder = orders[0];
      
      // Merge all items from all orders
      const allItems = orders.flatMap(order => order.items);
      
      // Calculate total amount across all orders
      const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      
      // Combine all payments (they should be the same for all orders)
      const allPayments = orders.flatMap(order => order.payments);
      
      // Create a combined order response
      const combinedOrder = {
        id: firstOrder.id,
        userId: firstOrder.userId,
        totalAmount: totalAmount.toString(),
        orderStatus: firstOrder.orderStatus,
        paymentRefId: firstOrder.paymentRefId,
        paymentStatus: firstOrder.paymentStatus,
        shippingAddressId: firstOrder.shippingAddressId,
        createdAt: firstOrder.createdAt,
        updatedAt: firstOrder.updatedAt,
        orderRefId: firstOrder.orderRefId,
        user: firstOrder.user,
        payments: allPayments,
        items: allItems,
        shippingAddress: firstOrder.shippingAddress,
        // Add metadata about the combined orders
        _metadata: {
          totalOrders: orders.length,
          orderIds: orders.map(order => order.id)
        }
      };

      // Console log for debugging - AFTER combining orders
      console.log("=== ORDER CONTROLLER DEBUG - AFTER COMBINING ===");
      console.log("Combined Order:", {
        id: combinedOrder.id,
        totalAmount: combinedOrder.totalAmount,
        totalItems: combinedOrder.items.length,
        totalPayments: combinedOrder.payments.length,
        metadata: combinedOrder._metadata
      });
      console.log("All Items:", combinedOrder.items.map(item => ({
        id: item.id,
        sellerId: item.sellerId,
        productName: item.productVariant.product.name,
        sellerName: item.productVariant.product.seller?.storeName || 'Unknown'
      })));
      console.log("=== END AFTER COMBINING ===");

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          combinedOrder,
          "Orders Fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetOrderItemTrackings(request: Request, id: string) {
    try {
      const OrderItemTrackings = await this.orderService.GetOrderItemTrackings({
        id,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          OrderItemTrackings,
          "Orders Fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async CancelOrderItem(request: Request, id: string) {
    const body = await request.json();

    const schema = z.object({
      cancelType: z.enum(["withRefund", "withoutRefund"]),
      refundAmount: z.number().optional()
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400
      });
    }

    const { cancelType, refundAmount } = parsed.data;

    try {
      const result = await this.orderService.CancelOrderItem({ id, cancelType, refundAmount });
      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "Order item cancelled successfully"
        )
      );
    } catch (error) {
      console.error(error);
      return this.handleError(error);
    }
  }

  async CancellRequest(request: Request, id: string) {
    try {
      const body = await request.json();
      const validatedData = OrderValidation.CancellRequest().parse({
        orderItemId: id,
        ...body,
      });

      const result = await this.orderService.CancellRequest({
        id: id,
        reason: validatedData.reason,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "Cancellation request sent successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetSellerOrders(request: Request) {
    try {
      const userData = request.headers.get("x-user");

      const user = userData ? (JSON.parse(userData) as SessionUser) : null;

      if (!user) {
        throw new Error("Unauthorized - User ID is required");
      }

      const orders = await this.orderService.GetSellerOrderItems({
        sellerId: user.sellerId,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          orders,
          "Orders Fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetSellerOrderDetails(request: Request, params: { id: string }) {
    try {
      const orders = await this.orderService.GetSellerOrderItemDetails({
        id: params.id,
      });

      if (!orders) throw Error("Order Item is Not Found");

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          orders,
          "Orders Fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }
  async UpdateSellerOrderStatus(request: Request, params: { id: string }) {
    try {
      const body = await request.json();
      const validatedData = OrderValidation.UpdateSellerOrderStatus().parse({
        ...body,
        id: params.id,
      });

      const orders = await this.orderService.UpdateSellerOrderStatus({
        id: params.id,
        status: validatedData.status,
      });

      if (!orders) throw Error("Order Item is Not Found");

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          orders,
          "Order Status Updated successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async getSellerOrderItems(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user: { id: string | null; sellerId: string | null } = userData
        ? JSON.parse(userData)
        : null;

      if (!user?.sellerId) throw new Error("Seller Not Found");

      // Get query parameters
      const url = new URL(request.url);
      const searchParams = new URLSearchParams(url.search);

      // Parse and validate query parameters
      const filters = {
        search: searchParams.get("search") || undefined,
        sortBy:
          (searchParams.get("sortBy") as
            | "createdAt"
            | "priceAtPurchase"
            | "status") || undefined,
        sortOrder:
          (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
        startDate: searchParams.get("startDate")
          ? new Date(searchParams.get("startDate")!)
          : undefined,
        endDate: searchParams.get("endDate")
          ? new Date(searchParams.get("endDate")!)
          : undefined,
        status:
          (searchParams.get("status") as
            | "total"
            | "pending"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "cancellRequested") || undefined,
        limit: searchParams.get("limit")
          ? parseInt(searchParams.get("limit")!)
          : 10,
        offset: searchParams.get("offset")
          ? parseInt(searchParams.get("offset")!)
          : 0,
      };

      const { success, error } =
        OrderValidation.GetSellerOrderItems().safeParse(filters);

      if (!success) {
        return NextResponse.json(
          ...ResponseGenerator.generate(
            400,
            null,
            "Validation failed",
            error.format()
          )
        );
      }

      const result = await this.orderService.getSellerOrderItems({
        sellerId: user.sellerId,
        filters,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "Seller order items retrieved successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): NextResponse {
    console.error(error);
    let errorMessage = "An unknown error occurred";
    let validationError = {};

    if (error instanceof z.ZodError) {
      errorMessage = "Validation Error";
      validationError = error.format();
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      ...ResponseGenerator.generate(500, null, errorMessage, validationError)
    );
  }
}
