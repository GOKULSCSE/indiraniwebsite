import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import db from "@/lib/db";
import { PaymentGatewayStatus, PaymentStatus } from "@prisma/client";
import { OrderService } from "@/modules/services/OrderService";
import crypto from "crypto";
import { ShiprocketService } from "@/modules/services/shiprocketservice";

export async function POST(request: Request) {
  try {
    console.log("🔄 Starting payment verification process...");
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    console.log("📦 Payment details:", { razorpay_order_id, razorpay_payment_id });

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error("❌ Payment signature verification failed");
      return NextResponse.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 }
      );
    }

    console.log("✅ Payment signature verified successfully");

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    console.log("💳 Razorpay payment details:", payment);

    // Find the order first
    const existingOrder = await db.order.findFirst({
      where: { paymentRefId: razorpay_order_id }
    });

    if (!existingOrder) {
      throw new Error("Order not found");
    }

    // Update order payment status
    console.log("🔄 Updating order payment status...");
    const order = await db.order.update({
      where: { id: existingOrder.id },
      data: {
        paymentStatus: PaymentStatus.paid,
        payments: {
          updateMany: {
            where: { paymentGatewayOrderId: razorpay_order_id },
            data: {
              paymentStatus: PaymentGatewayStatus.completed,
              transactionId: razorpay_payment_id,
            },
          },
        },
      },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true
              }
            },
            seller: true
          }
        },
        shippingAddress: true,
        user: true
      }
    });

    console.log("✅ Order payment status updated successfully");

    try {
      // Get all orders with the same paymentRefId to group by seller
      console.log("🔄 Fetching all orders for seller grouping...");
      const orderService = new OrderService();
      const allOrders = await orderService.GetOrderDetailsById({ id: order.id });
      
      console.log("📦 All orders found:", allOrders.length);
      console.log("📦 Order IDs:", allOrders.map(o => o.id));

      // Combine all items from all orders
      const allItems = allOrders.flatMap(order => order.items);
      console.log("📦 Total items across all orders:", allItems.length);

      // Group items by seller
      const itemsBySeller = allItems.reduce((groups, item) => {
        const sellerId = item.sellerId;
        if (!groups[sellerId]) {
          groups[sellerId] = {
            sellerId,
            sellerName: item.productVariant.product.seller?.storeName || 'Unknown Seller',
            items: []
          };
        }
        groups[sellerId].items.push(item);
        return groups;
      }, {} as Record<string, { 
        sellerId: string; 
        sellerName: string; 
        items: any[];
      }>);

      console.log("🏪 Items grouped by seller:", Object.keys(itemsBySeller));
      Object.entries(itemsBySeller).forEach(([sellerId, group]) => {
        console.log(`  Seller ${sellerId} (${group.sellerName}): ${group.items.length} items`);
        console.log(`    Items:`, group.items.map(item => ({
          id: item.id,
          name: item.productVariant.product.name,
          sku: item.productVariant.productVariantSKU,
          quantity: item.quantity,
          price: item.priceAtPurchase
        })));
      });

      // Create separate Shiprocket orders for each seller
      const shiprocketOrders = [];
      
      for (const [sellerId, sellerGroup] of Object.entries(itemsBySeller)) {
        console.log(`\n🚚 Creating Shiprocket order for seller: ${sellerGroup.sellerName} (${sellerId})`);
        
        // Get user's name from order data
        const nameParts = order.user.name?.split(' ') || ['', ''];
        
        // Calculate seller-specific totals
        const sellerSubtotal = sellerGroup.items.reduce((sum, item) => 
          sum + (Number(item.priceAtPurchase) * item.quantity), 0);
        const sellerShipping = sellerGroup.items.reduce((sum, item) => 
          sum + Number(item.shippingCharge || 0), 0);
        const sellerGST = sellerGroup.items.reduce((sum, item) => 
          sum + Number(item.gstAmountAtPurchase || 0), 0);
        const sellerDiscount = sellerGroup.items.reduce((sum, item) => 
          sum + Number(item.discountAmountAtPurchase || 0), 0);
        
        console.log(`  📊 Seller totals:`, {
          subtotal: sellerSubtotal,
          shipping: sellerShipping,
          gst: sellerGST,
          discount: sellerDiscount,
          total: sellerSubtotal + sellerGST + sellerShipping - sellerDiscount
        });
        
        // Use seller's pickup location or fallback
        const pickupLocation = "gandhipuram_123"; // Default pickup location
        
        console.log(`  📍 Using pickup location: ${pickupLocation}`);
        
        // Prepare Shiprocket order payload for this seller with ALL their items
        const shiprocketPayload = {
          order_id: `${sellerId}_${Date.now()}`, // Unique order ID for this seller
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: pickupLocation,
          billing_customer_name: nameParts[0] || "Customer",
          billing_last_name: nameParts[1] || nameParts[0] || "Name",
          billing_address: order.shippingAddress.street,
          billing_address_2: "",
          billing_city: order.shippingAddress.city,
          billing_pincode: order.shippingAddress.zipCode,
          billing_state: order.shippingAddress.state,
          billing_country: order.shippingAddress.country,
          billing_email: order.user.email,
          billing_phone: order.shippingAddress.phone || "9999999999",
          shipping_is_billing: true,
          order_items: sellerGroup.items.map(item => ({
            name: item.productVariant.product.name,
            sku: item.productVariant.productVariantSKU || `SKU_${item.id}`,
            units: item.quantity,
            selling_price: Number(item.priceAtPurchase),
            discount: Number(item.discountAmountAtPurchase) || 0,
            tax: Number(item.gstAmountAtPurchase) || 0,
            hsn: item.productVariant.product.hsnCode || 441122
          })),
          payment_method: "Prepaid",
          shipping_charges: sellerShipping,
          sub_total: sellerSubtotal,
          length: 10,
          breadth: 15,
          height: 20,
          weight: sellerGroup.items.reduce((total, item) => 
            total + (Number(item.productVariant.productWeight) || 1) * item.quantity, 0)
        };

        console.log(`  📦 Shiprocket payload for ${sellerGroup.sellerName}:`, {
          order_id: shiprocketPayload.order_id,
          pickup_location: shiprocketPayload.pickup_location,
          items_count: shiprocketPayload.order_items.length,
          order_items: shiprocketPayload.order_items,
          sub_total: shiprocketPayload.sub_total,
          shipping_charges: shiprocketPayload.shipping_charges,
          weight: shiprocketPayload.weight
        });

        try {
          // Create Shiprocket order using the service
          const shiprocketService = ShiprocketService.getInstance();
          const shiprocketData = await shiprocketService.createOrder(shiprocketPayload);
          
          console.log(`✅ Shiprocket order created successfully for ${sellerGroup.sellerName}:`, {
            shipment_id: shiprocketData.shipment_id,
            order_id: shiprocketData.order_id,
            awb_code: shiprocketData.awb_code,
            status: shiprocketData.status,
            status_code: shiprocketData.status_code
          });
          
          shiprocketOrders.push({
            sellerId,
            sellerName: sellerGroup.sellerName,
            itemsCount: sellerGroup.items.length,
            items: sellerGroup.items.map(item => ({
              id: item.id,
              name: item.productVariant.product.name,
              quantity: item.quantity
            })),
            shiprocketData,
            success: true,
            error: null
          });

        } catch (sellerError: any) {
          console.error(`❌ Failed to create Shiprocket order for seller ${sellerGroup.sellerName}:`, sellerError);
          
          shiprocketOrders.push({
            sellerId,
            sellerName: sellerGroup.sellerName,
            itemsCount: sellerGroup.items.length,
            items: sellerGroup.items.map(item => ({
              id: item.id,
              name: item.productVariant.product.name,
              quantity: item.quantity
            })),
            shiprocketData: null,
            success: false,
            error: sellerError.message
          });
        }
      }

      console.log(`\n🎉 Shiprocket order creation completed!`);
      console.log(`📊 Summary:`);
      console.log(`  - Total sellers: ${Object.keys(itemsBySeller).length}`);
      console.log(`  - Total items: ${allItems.length}`);
      console.log(`  - Successful shipments: ${shiprocketOrders.filter(o => o.success).length}`);
      console.log(`  - Failed shipments: ${shiprocketOrders.filter(o => !o.success).length}`);
      
      shiprocketOrders.forEach(order => {
        if (order.success) {
          console.log(`  ✅ ${order.sellerName}: ${order.itemsCount} items → AWB: ${order.shiprocketData?.awb_code}`);
        } else {
          console.log(`  ❌ ${order.sellerName}: ${order.itemsCount} items → Error: ${order.error}`);
        }
      });

      return NextResponse.json({
        success: true,
        message: `Payment verified and Shiprocket orders processed. Created ${shiprocketOrders.filter(o => o.success).length} successful shipments out of ${shiprocketOrders.length} total.`,
        data: {
          order,
          shiprocketOrders,
          summary: {
            totalSellers: Object.keys(itemsBySeller).length,
            totalItems: allItems.length,
            successfulShipments: shiprocketOrders.filter(o => o.success).length,
            failedShipments: shiprocketOrders.filter(o => !o.success).length
          }
        }
      });

    } catch (shiprocketError: any) {
      console.error("❌ Failed to process Shiprocket orders:", shiprocketError);
      // Even if Shiprocket order creation fails, we return success for payment
      // but include the error in the response
      return NextResponse.json({
        success: true,
        message: "Payment verified but Shiprocket order creation failed",
        data: {
          order,
          shiprocketError: shiprocketError.message
        }
      });
    }
  } catch (error: any) {
    console.error("❌ Payment verification error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
} 