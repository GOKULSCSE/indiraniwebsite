import {
  OrderStatus,
  OrderItemStatus,
  PaymentGatewayStatus,
  PaymentStatus,
} from "@prisma/client";
import _ from "lodash";

export interface IOrderTracking {
  orderItemId: string;
  status: OrderItemStatus;
  remarks?: string;
}

export interface IOrderItem {
  productVariantId: string;
  sellerId: string;
  userId: string;
  quantity: number;
  priceAtPurchase: number;
  gstAmountAtPurchase?: number;
  discountAmountAtPurchase?: number;
  status: OrderItemStatus;
  courierServiceId: number;
  shippingCharge: number;
  trackings?: IOrderTracking[];
}

export interface IOrder {
  userId: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentRefId?: string | null;
  paymentStatus: PaymentStatus;
  shippingAddressId: string;
  items: IOrderItem[];
}

export interface IPayment {
  id?: string;
  orderId?: string;
  paymentGateway: string;
  paymentStatus: PaymentGatewayStatus;
  paymentGatewayOrderId?: string;
  transactionId?: string;
  amount: number;
  paymentDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  userId: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentRefId: string | null;
  paymentStatus: PaymentStatus;
  shippingAddressId: string;
  items: IOrderItem[];

  constructor(data: IOrder) {
    this.userId = data.userId;
    this.totalAmount = data.totalAmount;
    this.orderStatus = data.orderStatus;
    this.paymentRefId = data.paymentRefId || null;
    this.paymentStatus = data.paymentStatus;
    this.shippingAddressId = data.shippingAddressId;
    this.items = data.items;
  }
}
