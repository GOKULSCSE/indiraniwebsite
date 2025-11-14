import { OrderItemStatus } from "@prisma/client";

export const SHIPMENT_STATUS_CODES = {
  6: {
    orderItemStatus: OrderItemStatus.shipped,
    shipmentStatus: "Shipped",
    statusCode: 6,
  },
  7: {
    orderItemStatus: OrderItemStatus.delivered,
    shipmentStatus: "Delivered",
    statusCode: 7,
  },
  19: {
    orderItemStatus: OrderItemStatus.outForDelivery,
    shipmentStatus: "Out for Delivery",
    statusCode: 19,
  },
  5: {
    orderItemStatus: OrderItemStatus.cancelled,
    shipmentStatus: "Cancelled",
    statusCode: 5,
  },
};
