import { NextRequest, NextResponse } from "next/server";
import { SHIPMENT_STATUS_CODES } from "@/utils/constants";
import db from "@/lib/db";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  logger.info('Shiprocket webhook received', {
    headers: {
      contentType: request.headers.get("content-type"),
      userAgent: request.headers.get("user-agent"),
    }
  });

  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.SHIPROCKET_WEBHOOK_KEY) {
    logger.warn('Webhook unauthorized - invalid API key', {
      receivedKeyPrefix: apiKey?.substring(0, 8) + '...',
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();

    const {
      awb,
      courier_name,
      current_status,
      current_status_id,
      shipment_status,
      shipment_status_id,
      current_timestamp,
      order_id,
      sr_order_id,
      etd,
      scans,
      is_return,
      channel_id,
    } = payload;

    logger.info('Webhook payload parsed', {
      awb,
      courierName: courier_name,
      currentStatus: current_status,
      currentStatusId: current_status_id,
      orderId: order_id,
      srOrderId: sr_order_id,
      isReturn: is_return,
      etd,
      scansCount: scans?.length || 0
    });

    const status =
      current_status_id in SHIPMENT_STATUS_CODES
        ? SHIPMENT_STATUS_CODES[
            current_status_id as keyof typeof SHIPMENT_STATUS_CODES
          ]
        : null;

    if (status) {
      logger.info('Status code mapped successfully', {
        awb,
        statusCode: current_status_id,
        shipmentStatus: status.shipmentStatus,
        orderItemStatus: status.orderItemStatus
      });

      const shipment = await db.shipments.findFirst({
        where: {
          AWB: awb,
        },
      });

      if (shipment) {
        logger.info('Shipment found, updating status', {
          shipmentId: shipment.id,
          awb,
          oldStatus: shipment.shipmentStatus,
          newStatus: status.shipmentStatus
        });

        await db.shipments.update({
          where: {
            id: shipment.id,
          },
          data: {
            shipmentStatus: status.shipmentStatus,
          },
        });

        await db.orderItem.updateMany({
          where: {
            shipmentId: shipment.id,
          },
          data: {
            status: status.orderItemStatus,
            statusCode: status.statusCode,
          },
        });

        const updatedOrderItems = await db.orderItem.findMany({
          where: {
            shipmentId: shipment.id,
          },
        });

        logger.info('Order items updated', {
          shipmentId: shipment.id,
          awb,
          itemCount: updatedOrderItems.length,
          newStatus: status.orderItemStatus
        });

        await db.orderTracking.createMany({
          data: updatedOrderItems.map((item) => ({
            orderItemId: item.id,
            status: item.status,
            statusCode: item.statusCode,
            remarks: item.status,
          })),
        });

        logger.info('Order tracking entries created', {
          shipmentId: shipment.id,
          awb,
          trackingEntriesCount: updatedOrderItems.length
        });

        logger.info('Shipment webhook processed successfully', {
          shipmentId: shipment.id,
          awb,
          orderId: order_id,
          status: status.shipmentStatus,
          duration: `${Date.now() - startTime}ms`
        });
      } else {
        logger.warn('Shipment not found in database', {
          awb,
          orderId: order_id,
          srOrderId: sr_order_id,
          currentStatus: current_status
        });
      }
      
    } else {
      logger.warn('Invalid or unmapped status code', {
        statusCode: current_status_id,
        currentStatus: current_status,
        awb,
        orderId: order_id
      });
    }
  } catch (err) {
    logger.error('Webhook processing failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      duration: `${Date.now() - startTime}ms`
    });
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  logger.http('POST /api/shipmentwebhook', {
    statusCode: 200,
    duration: `${Date.now() - startTime}ms`,
    awb: payload?.awb,
    orderId: payload?.order_id
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
