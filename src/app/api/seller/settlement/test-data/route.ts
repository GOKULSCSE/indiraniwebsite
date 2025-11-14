 import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check if we already have test data
    const existingCount = await db.orderItem.count();
    if (existingCount > 0) {
      return NextResponse.json({
        message: "Test data already exists",
        orderItemCount: existingCount,
      });
    }

    // Get a seller and product variant to use for test data
    const seller = await db.sellerProfile.findFirst({
      include: { user: true },
    });

    const productVariant = await db.productVariant.findFirst({
      include: {
        product: true,
        ProductVariantImage: true,
      },
    });

    const user = await db.user.findFirst({
      where: { roleId: "USER" },
    });

    const address = await db.address.findFirst();

    if (!seller || !productVariant || !user || !address) {
      return NextResponse.json(
        {
          error: "Missing required data",
          details: {
            sellers: await db.sellerProfile.count(),
            productVariants: await db.productVariant.count(),
            users: await db.user.count(),
            addresses: await db.address.count(),
          },
        },
        { status: 400 }
      );
    }

    // Create test order
    const order = await db.order.create({
      data: {
        userId: user.id,
        totalAmount: 500,
        orderStatus: "pending",
        paymentStatus: "paid",
        shippingAddressId: address.id,
        orderRefId: "TEST-ORD-001",
      },
    });

    // Create test order items with different statuses
    const testOrderItems = [
      {
        orderId: order.id,
        sellerId: seller.id,
        userId: user.id,
        productVariantId: productVariant.id,
        quantity: 1,
        priceAtPurchase: 100,
        gstAmountAtPurchase: 18,
        discountAmountAtPurchase: 10,
        shippingCharge: 50,
        status: "pending",
        isSettlement: null,
      },
      {
        orderId: order.id,
        sellerId: seller.id,
        userId: user.id,
        productVariantId: productVariant.id,
        quantity: 2,
        priceAtPurchase: 200,
        gstAmountAtPurchase: 36,
        discountAmountAtPurchase: 20,
        shippingCharge: 0,
        status: "shipped",
        isSettlement: false,
      },
      {
        orderId: order.id,
        sellerId: seller.id,
        userId: user.id,
        productVariantId: productVariant.id,
        quantity: 1,
        priceAtPurchase: 150,
        gstAmountAtPurchase: 27,
        discountAmountAtPurchase: 0,
        shippingCharge: 30,
        status: "delivered",
        isSettlement: false,
      },
    ];

    const createdOrderItems = await Promise.all(
      testOrderItems.map((item) => db.orderItem.create({ data: item }))
    );

    // Create order tracking for each item
    await Promise.all(
      createdOrderItems.map((item) =>
        db.orderTracking.create({
          data: {
            orderItemId: item.id,
            status: item.status as any,
            remarks: `Test order item with status: ${item.status}`,
          },
        })
      )
    );

    return NextResponse.json({
      message: "Test data created successfully",
      order: order,
      orderItems: createdOrderItems.length,
      details: {
        seller: seller.storeName,
        product: productVariant.product.name,
        user: user.name,
      },
    });
  } catch (error) {
    console.error("Error creating test data:", error);
    return NextResponse.json(
      { 
        error: "Failed to create test data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Delete test order items and related data
    const testOrder = await db.order.findFirst({
      where: { orderRefId: "TEST-ORD-001" },
    });

    if (testOrder) {
      // Delete order tracking first
      await db.orderTracking.deleteMany({
        where: {
          orderItem: {
            orderId: testOrder.id,
          },
        },
      });

      // Delete order items
      await db.orderItem.deleteMany({
        where: { orderId: testOrder.id },
      });

      // Delete order
      await db.order.delete({
        where: { id: testOrder.id },
      });

      return NextResponse.json({
        message: "Test data deleted successfully",
      });
    } else {
      return NextResponse.json({
        message: "No test data found to delete",
      });
    }
  } catch (error) {
    console.error("Error deleting test data:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete test data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 