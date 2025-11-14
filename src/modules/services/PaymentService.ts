import db from "../../lib/db";
import { PaymentGatewayStatus, Prisma } from "@prisma/client";

export class PaymentService {
  async getSellerPayments({
    sellerId,
    filters,
  }: {
    sellerId: string;
    filters: {
      search?: string;
      sortBy?: "createdAt" | "amount" | "orderItemId";
      sortOrder?: "asc" | "desc";
      startDate?: Date;
      endDate?: Date;
      status?: "total" | "paid" | "refunded";
      limit: number;
      offset: number;
    };
  }) {
    try {
      // Always get all order items for counts
      const allOrderItems = await db.orderItem.findMany({
        where: { sellerId },
      });
      // Calculate counts from all order items
      let paidCount = 0;
      let refundedCount = 0;
      allOrderItems.forEach((item) => {
        if (item.isRefunded) {
          refundedCount++;
        } else {
          paidCount++;
        }
      });
      const totalCount = allOrderItems.length;

      // Calculate overall paid and refunded amounts from all order items
      let overallPaidAmount = 0;
      let overallRefundedAmount = 0;
      allOrderItems.forEach((item) => {
        const priceAtPurchase = Number(item.priceAtPurchase);
        const isRefunded = item.isRefunded;
        const refundedAmount = Number(item.refundedAmount) || 0;
        if (!isRefunded) {
          overallPaidAmount += priceAtPurchase;
        } else {
          if (refundedAmount < priceAtPurchase) {
            overallPaidAmount += priceAtPurchase - refundedAmount;
            overallRefundedAmount += refundedAmount;
          } else {
            overallRefundedAmount += refundedAmount;
          }
        }
      });

      // Create sequential numbering for all order items
      const orderItemMap = new Map<string, number>();
      const orderItemSequentialMap = new Map<string, string>();
      const uniqueOrderMap = new Map<string, number>();
      let orderCounter = 100; // Start from 100

      // Calculate sequential numbering for all order items
      allOrderItems.forEach((item) => {
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

      // Now get paginated/filtered order items for the payments array
      // (status filter, search, date, etc. as before)
      const where: any = {
        sellerId,
      };
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }
      if (filters.search) {
        where.OR = [
          {
            productVariant: {
              title: { contains: filters.search, mode: "insensitive" },
            },
          },
          {
            User: {
              name: { contains: filters.search, mode: "insensitive" },
            },
          },
        ];
      }
      if (filters.status === 'paid') {
        where.isRefunded = false;
      } else if (filters.status === 'refunded') {
        where.isRefunded = true;
      }
      const orderItems = await db.orderItem.findMany({
        where,
        include: {
          productVariant: {
            include: {
              product: { include: { images: true } },
            },
          },
          User: true,
          seller: true,
          OrderItemPayment: true,
        },
        orderBy: filters.sortBy
          ? { [filters.sortBy]: filters.sortOrder || "desc" }
          : { createdAt: "desc" },
        take: filters.limit,
        skip: filters.offset,
      });

      // Add the sequential numbering to the paginated results
      const orderItemsWithSequentialNumbering = orderItems.map((item) => {
        const formattedOrderId = orderItemSequentialMap.get(item.id) || `100-1`;
        
        return {
          ...item,
          formattedOrderId,
        };
      });

      // Calculate paid and refunded amounts for the filtered set
      let paid = 0;
      let refunded = 0;
      let total = orderItems.length;
      orderItems.forEach((item) => {
        const priceAtPurchase = Number(item.priceAtPurchase);
        const isRefunded = item.isRefunded;
        const refundedAmount = Number(item.refundedAmount) || 0;
        if (!isRefunded) {
          paid += priceAtPurchase;
        } else {
          if (refundedAmount < priceAtPurchase) {
            paid += priceAtPurchase - refundedAmount;
            refunded += refundedAmount;
          } else {
            refunded += refundedAmount;
          }
        }
      });
      const formattedCounts = {
        total: totalCount,
        paid: paidCount,
        refunded: refundedCount,
        overallPaidAmount,
        overallRefundedAmount,
      };

      return {
        count: formattedCounts,
        payments: orderItemsWithSequentialNumbering,
      };
    } catch (error: any) {
      throw {
        message: error.message || "Failed to get seller payments",
        status: 500,
      };
    }
  }
}
