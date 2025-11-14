import { NextRequest, NextResponse } from "next/server";
import HmacSHA256 from "crypto-js/hmac-sha256";
import Hex from "crypto-js/enc-hex";
import db from "@/lib/db";
import { PaymentGatewayStatus, PaymentStatus } from "@prisma/client";
import { mail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/mail/templates/order-confirmation-template";
import { OrderService } from "@/modules/services/OrderService";

const orderService = new OrderService();

export async function POST(req: NextRequest) {
  try {
    console.log("=== RAZORPAY WEBHOOK TRIGGERED ===");
    console.log("Webhook URL:", req.url);
    console.log("Headers:", Object.fromEntries(req.headers.entries()));
    
    const payload = await req.text();
    console.log("Webhook payload received:", payload.substring(0, 500) + "...");
    
    const razorpaySignature = req.headers.get("x-razorpay-signature");
    console.log("Razorpay signature present:", !!razorpaySignature);

    if (!razorpaySignature) {
      console.error("Missing signature header");
      return NextResponse.json(
        { success: false, message: "Missing signature header" },
        { status: 400 }
      );
    }

    const expectedSignature = HmacSHA256(
      payload,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    ).toString(Hex);

    console.log("Signature validation:", expectedSignature === razorpaySignature);

    if (expectedSignature !== razorpaySignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    const eventType = event.event;

    console.log(`Processing webhook event: ${eventType}`);
    console.log("Event entity:", event.entity);
    console.log("Event payload:", JSON.stringify(event.payload, null, 2));

    switch (eventType) {
      case "payment.authorized":
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case "payment.dispute.created":
        await handleRefundCreated(event.payload.refund.entity);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    console.log("=== WEBHOOK PROCESSING COMPLETED ===");

    return NextResponse.json(
      { success: true, message: "Webhook received" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function handlePaymentAuthorized(payment: any) {
  console.log("Payment authorized:", payment);

  try {
    const order = await db.order.findFirst({
      where: { paymentRefId: payment.order_id },
      include: { items: true },
    });

    if (!order) {
      console.error(`Order not found for payment ID: ${payment.id}`);
      return;
    }

    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.authorized },
    });

    // Find existing payment or create a new one
    const existingPayment = await db.payment.findFirst({
      where: {
        orderId: order.id,
        paymentGatewayOrderId: payment.order_id,
      },
    });

    let paymentRecord;
    if (existingPayment) {
      // Update existing payment
      paymentRecord = await db.payment.update({
        where: { id: existingPayment.id },
        data: {
          paymentStatus: PaymentGatewayStatus.authorized,
          transactionId: payment.id,
          amount: payment.amount / 100,
          paymentDate: new Date(payment.created_at * 1000),
        },
      });
    } else {
      // Create new payment
      paymentRecord = await db.payment.create({
        data: {
          orderId: order.id,
          paymentGateway: "razorpay",
          paymentStatus: PaymentGatewayStatus.authorized,
          paymentGatewayOrderId: payment.order_id,
          transactionId: payment.id,
          amount: payment.amount / 100,
          paymentDate: new Date(payment.created_at * 1000),
        },
      });
    }

    // Create or update payment records for each order item
    for (const item of order.items) {
      const itemAmount = Number(item.priceAtPurchase) * item.quantity;

      // Find if payment record exists
      const existingItemPayment = await db.orderItemPayment.findFirst({
        where: {
          orderItemId: item.id,
          paymentId: paymentRecord.id,
        },
      });

      if (existingItemPayment) {
        // Update existing record
        await db.orderItemPayment.update({
          where: { id: existingItemPayment.id },
          data: {
            amount: itemAmount,
            paymentStatus: PaymentGatewayStatus.authorized,
          },
        });
      } else {
        // Create new record
        await db.orderItemPayment.create({
          data: {
            id: `${item.id}_${paymentRecord.id}`,
            orderItemId: item.id,
            paymentId: paymentRecord.id,
            amount: itemAmount,
            paymentStatus: PaymentGatewayStatus.authorized,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error handling payment authorization:", error);
  }
}

async function handlePaymentCaptured(payment: any) {
  console.log("=== PAYMENT CAPTURED - EMAIL PROCESSING STARTED ===");
  console.log("Payment captured:", payment);
  console.log("Payment ID:", payment.id);
  console.log("Order ID:", payment.order_id);
  console.log("Amount:", payment.amount);

  try {
    const order = await db.order.findFirst({
      where: { paymentRefId: payment.order_id },
      include: {
        items: true,
        user: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      console.error(`Order not found for payment ID: ${payment.id}`);
      return;
    }

    let orderdetails = await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.paid },
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
              },
            },
          },
        },
        shippingAddress: true,
        user: true,
        payments: true,
      },
    });

    let orderData = await orderService.GetOrderDetailsById({ id: order.id });
    
    // Console log for debugging
    console.log("=== WEBHOOK DEBUG ===");
    console.log("OrderData received:", typeof orderData);
    console.log("Is array:", Array.isArray(orderData));
    if (Array.isArray(orderData)) {
      console.log("Array length:", orderData.length);
      console.log("All order IDs:", orderData.map(o => o.id));
      console.log("Total items across all orders:", orderData.reduce((sum, o) => sum + o.items.length, 0));
    }
    console.log("=== END WEBHOOK DEBUG ===");
    
    // Since GetOrderDetailsById now returns an array, we need to combine ALL orders for email
    if (!Array.isArray(orderData) || orderData.length === 0) {
      console.error("No order data found for email");
      return;
    }

    // Use the first order as the base, but combine items from ALL orders
    const baseOrder = orderData[0];
    
    // Combine all items from all orders
    const allItems = orderData.flatMap(order => order.items);
    
    // Combine all payments from all orders
    const allPayments = orderData.flatMap(order => order.payments);
    
    // Calculate total amount across all orders
    const totalAmount = orderData.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    console.log("=== WEBHOOK COMBINATION DEBUG ===");
    console.log("Base order ID:", baseOrder.id);
    console.log("Total items combined:", allItems.length);
    console.log("Items by seller:", allItems.reduce((acc: Record<string, number>, item) => {
      const sellerId = item.sellerId;
      acc[sellerId] = (acc[sellerId] || 0) + 1;
      return acc;
    }, {}));
    console.log("Combined total amount:", totalAmount);
    console.log("=== END COMBINATION DEBUG ===");

    // Convert the combined order data to match the email template interface
    const emailOrderData = {
      id: baseOrder.id,
      createdAt: baseOrder.createdAt.toISOString(),
      orderStatus: baseOrder.orderStatus,
      paymentStatus: baseOrder.paymentStatus,
      totalAmount: totalAmount.toString(),
      user: baseOrder.user,
      shippingAddress: baseOrder.shippingAddress,
      items: allItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase.toString(),
        discountAmountAtPurchase: item.discountAmountAtPurchase?.toString() || "0",
        gstAmountAtPurchase: item.gstAmountAtPurchase?.toString() || "0",
        shippingCharge: item.shippingCharge?.toString() || "0",
        status: item.status,
        sellerId: item.sellerId,
        productVariant: {
          title: item.productVariant.title,
          price: item.productVariant.price.toString(),
          ProductVariantImage: item.productVariant.ProductVariantImage,
          product: {
            name: item.productVariant.product.name,
            seller: item.productVariant.product.seller
          }
        }
      })),
      payments: allPayments.map(payment => ({
        paymentGateway: payment.paymentGateway,
        transactionId: payment.transactionId || "",
        paymentDate: payment.paymentDate?.toISOString() || new Date().toISOString(),
        paymentGatewayOrderId: payment.paymentGatewayOrderId
      })),
      _metadata: {
        totalOrders: orderData.length,
        orderIds: orderData.map(o => o.id)
      }
    };

    console.log("Email data prepared:", {
      orderId: emailOrderData.id,
      itemsCount: emailOrderData.items.length,
      totalAmount: emailOrderData.totalAmount
    });

    await mail.sendMail({
      to: orderdetails.user.email,
      subject: "Order Confirmation",
      template: generateOrderConfirmationEmail(emailOrderData),
    });

    console.log("=== EMAIL SENT SUCCESSFULLY ===");
    console.log("Email sent to:", orderdetails.user.email);
    console.log("Email subject: Order Confirmation");
    console.log("=== EMAIL PROCESSING COMPLETED ===");

    // Find existing payment or create a new one
    const existingPayment = await db.payment.findFirst({
      where: {
        orderId: order.id,
        paymentGatewayOrderId: payment.order_id,
      },
    });

    let paymentRecord;
    if (existingPayment) {
      // Update existing payment
      paymentRecord = await db.payment.update({
        where: { id: existingPayment.id },
        data: {
          paymentStatus: PaymentGatewayStatus.completed,
          transactionId: payment.id,
          amount: payment.amount / 100,
          paymentDate: new Date(payment.created_at * 1000),
        },
      });
    } else {
      // Create new payment
      paymentRecord = await db.payment.create({
        data: {
          orderId: order.id,
          paymentGateway: "razorpay",
          paymentStatus: PaymentGatewayStatus.completed,
          paymentGatewayOrderId: payment.order_id,
          transactionId: payment.id,
          amount: payment.amount / 100,
          paymentDate: new Date(payment.created_at * 1000),
        },
      });
    }

    // Create or update payment records for each order item
    for (const item of order.items) {
      const itemAmount = Number(item.priceAtPurchase) * item.quantity;

      // Find if payment record exists
      const existingItemPayment = await db.orderItemPayment.findFirst({
        where: {
          orderItemId: item.id,
          paymentId: paymentRecord.id,
        },
      });

      if (existingItemPayment) {
        // Update existing record
        await db.orderItemPayment.update({
          where: { id: existingItemPayment.id },
          data: {
            amount: itemAmount,
            paymentStatus: PaymentGatewayStatus.completed,
          },
        });
      } else {
        // Create new record
        await db.orderItemPayment.create({
          data: {
            id: `${item.id}_${paymentRecord.id}`,
            orderItemId: item.id,
            paymentId: paymentRecord.id,
            amount: itemAmount,
            paymentStatus: PaymentGatewayStatus.completed,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error handling payment capture:", error);
  }
}

async function handlePaymentFailed(payment: any) {
  console.log("Payment failed:", payment);

  try {
    const order = await db.order.findFirst({
      where: { paymentRefId: payment.order_id },
      include: { items: true },
    });

    if (!order) {
      console.error(`Order not found for payment ID: ${payment.id}`);
      return;
    }

    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.failed },
    });

    // Find existing payment or create a new one
    const existingPayment = await db.payment.findFirst({
      where: {
        orderId: order.id,
        paymentGatewayOrderId: payment.order_id,
      },
    });

    let paymentRecord;
    if (existingPayment) {
      // Update existing payment
      paymentRecord = await db.payment.update({
        where: { id: existingPayment.id },
        data: {
          paymentStatus: PaymentGatewayStatus.failed,
          transactionId: payment.id,
          amount: payment.amount / 100,
          paymentDate: new Date(payment.created_at * 1000),
        },
      });
    } else {
      // Create new payment
      paymentRecord = await db.payment.create({
        data: {
          orderId: order.id,
          paymentGateway: "razorpay",
          paymentStatus: PaymentGatewayStatus.failed,
          paymentGatewayOrderId: payment.order_id,
          transactionId: payment.id,
          amount: payment.amount / 100,
          paymentDate: new Date(payment.created_at * 1000),
        },
      });
    }

    // Create or update payment records for each order item
    for (const item of order.items) {
      const itemAmount = Number(item.priceAtPurchase) * item.quantity;

      // Find if payment record exists
      const existingItemPayment = await db.orderItemPayment.findFirst({
        where: {
          orderItemId: item.id,
          paymentId: paymentRecord.id,
        },
      });

      if (existingItemPayment) {
        // Update existing record
        await db.orderItemPayment.update({
          where: { id: existingItemPayment.id },
          data: {
            amount: itemAmount,
            paymentStatus: PaymentGatewayStatus.failed,
          },
        });
      } else {
        // Create new record
        await db.orderItemPayment.create({
          data: {
            id: `${item.id}_${paymentRecord.id}`,
            orderItemId: item.id,
            paymentId: paymentRecord.id,
            amount: itemAmount,
            paymentStatus: PaymentGatewayStatus.failed,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

async function handleRefundCreated(refund: any) {
  console.log("Refund created:", refund.id);

  try {
    const payment = await db.payment.findFirst({
      where: { transactionId: refund.payment_id },
      include: { order: { include: { items: true } } },
      orderBy: { createdAt: "desc" },
    });

    if (!payment) {
      console.error(`Payment not found for refund ID: ${refund.id}`);
      return;
    }

    await db.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: PaymentStatus.refunded },
    });

    // Update the main payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: PaymentGatewayStatus.refunded,
      },
    });

    // Create a refund payment record
    const refundPayment = await db.payment.create({
      data: {
        orderId: payment.orderId,
        paymentGateway: "razorpay",
        paymentStatus: PaymentGatewayStatus.refunded,
        paymentGatewayOrderId:
          payment.paymentGatewayOrderId || `refund_${refund.id}`,
        transactionId: refund.id,
        amount: refund.amount / 100,
        paymentDate: new Date(refund.created_at * 1000),
      },
    });

    // Update OrderItemPayment records for each order item
    for (const item of payment.order.items) {
      const itemAmount = Number(item.priceAtPurchase) * item.quantity;
      // Calculate proportional refund amount based on item's proportion of total
      const refundAmount =
        (refund.amount / 100) * (Number(itemAmount) / Number(payment.amount));

      // Update the original payment's item status
      const existingItemPayment = await db.orderItemPayment.findFirst({
        where: {
          orderItemId: item.id,
          paymentId: payment.id,
        },
      });

      if (existingItemPayment) {
        await db.orderItemPayment.update({
          where: { id: existingItemPayment.id },
          data: {
            paymentStatus: PaymentGatewayStatus.refunded,
          },
        });
      }

      // Create refund record for each order item
      await db.orderItemPayment.create({
        data: {
          id: `refund_${item.id}_${refundPayment.id}`,
          orderItemId: item.id,
          paymentId: refundPayment.id,
          amount: refundAmount,
          paymentStatus: PaymentGatewayStatus.refunded,
        },
      });
    }
  } catch (error) {
    console.error("Error handling refund creation:", error);
  }
}
