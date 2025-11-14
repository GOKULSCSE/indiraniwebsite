import { NextRequest, NextResponse } from "next/server";
import HmacSHA256 from "crypto-js/hmac-sha256";
import Hex from "crypto-js/enc-hex";
import db from "@/lib/db";
import { PaymentGatewayStatus, PaymentStatus } from "@prisma/client";
import { mail } from "@/lib/mail";
import { generateOrderConfirmationEmail } from "@/lib/mail/templates/order-confirmation-template";

export async function POST(req: NextRequest) {
  try {
    console.log(JSON.stringify(req));
    const payload = await req.text();
    const razorpaySignature = req.headers.get("x-razorpay-signature");

    if (!razorpaySignature) {
      return NextResponse.json(
        { success: false, message: "Missing signature header" },
        { status: 400 }
      );
    }

    const expectedSignature = HmacSHA256(
      payload,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    ).toString(Hex);

    if (expectedSignature !== razorpaySignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    const eventType = event.event;

    console.log(`Received Razorpay webhook: ${eventType}`);

    await webhookHandler(
      event,
      event.payload.refund.entity.id,
      event.payload.payment.entity.id
    );

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

async function webhookHandler(event: any, refundId: string, paymentId: string) {
  console.log("razorpay refund webhook", event);
  console.log("razorpay refund id", refundId);
  console.log("razorpay payment id", paymentId);

  const orderItem = await db.orderItem.findFirst({
    where: {
      OR: [
        { refundId: refundId },
        {
          order: {
            payments: {
              some: {
                transactionId: paymentId,
              },
            },
          },
        },
      ],
    },
  });

  if (!orderItem) {
    return;
  }

  await db.orderItem.update({
    where: { id: orderItem.id },
    data: {
      refundStatus: event.payload.refund.entity.status,
      isRefunded:
        event.payload.refund.entity.status === "processed" ? true : false,
      refundId: event.payload.refund.entity.id,
      refundedAmount: event.payload.refund.entity.amount / 100,
    },
  });
}
