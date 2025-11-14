import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get basic counts
    const totalOrderItems = await db.orderItem.count();
    
    // Get status distribution
    const statusDistribution = await db.orderItem.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    // Get settlement distribution
    const settlementDistribution = await db.orderItem.groupBy({
      by: ['isSettlement'],
      _count: { isSettlement: true }
    });

    // Get sample data (first 10 items with full details)
    const sampleOrderItems = await db.orderItem.findMany({
      take: 10,
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
          },
        },
        productVariant: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            ProductVariantImage: {
              orderBy: {
                isPrimary: "desc",
              },
              take: 1,
            },
          },
        },
        order: {
          select: {
            id: true,
            orderRefId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check commission data - get all commissions for debugging
    const commissionData = await db.commission.findMany({
      include: {
        seller: {
          select: {
            id: true,
            storeName: true
          }
        }
      }
    });

    return NextResponse.json({
      totalOrderItems,
      statusDistribution,
      settlementDistribution,
      commissionData,
      sampleOrderItems: sampleOrderItems.map(item => ({
        id: item.id,
        status: item.status,
        isSettlement: item.isSettlement,
        storeName: item.seller.storeName,
        productName: item.productVariant.product.name,
        orderId: (item.order.orderRefId || item.order.id).replace(/^order_/i, ''),
        productTotal: item.priceAtPurchase,
        gstAmountAtPurchase: item.gstAmountAtPurchase,
        shippingCharge: item.shippingCharge,
        productImage: item.productVariant.ProductVariantImage[0]?.imageUrl || null,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 