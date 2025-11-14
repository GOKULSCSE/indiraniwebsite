import { NextRequest, NextResponse } from "next/server";
import HmacSHA256 from "crypto-js/hmac-sha256";
import Hex from "crypto-js/enc-hex";
import db from "@/lib/db";
import { PaymentGatewayStatus, PaymentStatus } from "@prisma/client";
import { ShiprocketService } from "@/modules/services/shiprocketservice";

// Function to create Shiprocket order for a seller group
async function createShiprocketOrderForSeller(sellerGroup: any, order: any) {
  try {
    console.log(`🚚 Creating Shiprocket order for seller: ${sellerGroup.sellerName} (${sellerGroup.sellerId})`);
    console.log(`📦 Items in this seller group: ${sellerGroup.items.length}`);
    
    const shiprocketService = ShiprocketService.getInstance();

    // Use the first item to get seller information (all items have same seller)
    const firstItem = sellerGroup.items[0];
    
    // Get pickup location for this seller
    const pickupLocation = await db.pickuplocation.findFirst({
      where: {
        sellerProfileId: firstItem.productVariant.product.seller.id,
        location_id: firstItem.DraftShipments.pickupLocationId,
      },
      include: {
        seller: true,
      },
    });

    if (!pickupLocation) {
      throw new Error(
        `No pickup location found for seller: ${firstItem.productVariant.product.seller.id}`
      );
    }

    // Get pickup locations from Shiprocket to validate
    const shiprocketLocations = await shiprocketService.getPickupLocations();
    const locationDetails = shiprocketLocations?.data?.shipping_address?.find(
      (loc: any) => loc.id === pickupLocation.location_id
    );

    if (!locationDetails) {
      throw new Error(
        `Invalid pickup location ID: ${pickupLocation.location_id}`
      );
    }

    // Format phone number
    const formattedPhone = (order.shippingAddress.phone || "").replace(
      /^0+|[^\d]/g,
      ""
    );
    if (!formattedPhone) {
      throw new Error("Valid phone number is required");
    }

    // Get user's name parts
    const nameParts = order.user.name?.split(" ") || ["", ""];

    // Calculate totals for this seller
    const sellerSubtotal = sellerGroup.items.reduce((sum: number, item: any) => 
      sum + (Number(item.priceAtPurchase) * item.quantity), 0);
    const sellerShipping = sellerGroup.items.reduce((sum: number, item: any) => 
      sum + Number(item.DraftShipments.shippingCharge || 0), 0);
    const sellerGST = sellerGroup.items.reduce((sum: number, item: any) => 
      sum + Number(item.gstAmountAtPurchase || 0), 0);
    const sellerDiscount = sellerGroup.items.reduce((sum: number, item: any) => 
      sum + Number(item.discountAmountAtPurchase || 0), 0);
    const totalWeight = sellerGroup.items.reduce((total: number, item: any) => 
      total + (Number(item.productVariant.productWeight || 0.5) * item.quantity), 0);

    console.log(`  📊 Seller totals:`, {
      subtotal: sellerSubtotal,
      shipping: sellerShipping,
      gst: sellerGST,
      discount: sellerDiscount,
      weight: totalWeight,
      itemCount: sellerGroup.items.length
    });

    // Generate a shorter order ID (max 50 chars)
    const shortOrderId = `ORD_${order.id.slice(0, 8)}_${sellerGroup.sellerId.slice(0, 8)}_${Date.now().toString().slice(-6)}`;

    // Prepare Shiprocket order payload for this seller with ALL their items
    const shiprocketPayload = {
      order_id: shortOrderId,
      order_date: new Date().toISOString().replace("T", " ").substring(0, 16),
      pickup_location: locationDetails.pickup_location,
      comment: `Order from ${order.user.name} - Seller: ${sellerGroup.sellerName}`,
      billing_customer_name: nameParts[0] || "Customer",
      billing_last_name: nameParts[1] || nameParts[0] || "Name",
      billing_address: order.shippingAddress.street,
      billing_address_2: order.shippingAddress.landmark || "",
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.zipCode,
      billing_state: order.shippingAddress.state,
      billing_country: order.shippingAddress.country || "India",
      billing_email: order.user.email,
      billing_phone: formattedPhone,
      shipping_is_billing: true,
      shipping_customer_name: "",
      shipping_last_name: "",
      shipping_address: "",
      shipping_address_2: "",
      shipping_city: "",
      shipping_pincode: "",
      shipping_country: "",
      shipping_state: "",
      shipping_email: "",
      shipping_phone: "",
      order_items: sellerGroup.items.map((item: any) => {
        // Format HSN code - ensure it's numeric and max 15 chars
        const hsnCode = (item.productVariant.product.hsnCode || "123456789")
          .replace(/[^0-9]/g, "") // Remove non-numeric characters
          .slice(0, 15); // Limit to 15 characters

        return {
          name: item.productVariant.product.name,
          sku: item.productVariant.productVariantSKU || `SKU_${item.id}`,
          units: item.quantity,
          selling_price: Number(item.priceAtPurchase),
          discount: Number(item.discountAmountAtPurchase) || 0,
          tax: Number(item.gstAmountAtPurchase) || 0,
          hsn: hsnCode,
        };
      }),
      payment_method: "Prepaid",
      shipping_charges: sellerShipping,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: sellerDiscount,
      sub_total: sellerSubtotal,
      length: 10,
      breadth: 15,
      height: 20,
      weight: totalWeight || 0.5,
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

    const shiprocketData = await shiprocketService.createOrder(shiprocketPayload);
    console.log(`✅ Shiprocket order created successfully for ${sellerGroup.sellerName}:`, {
      shipment_id: shiprocketData.shipment_id,
      order_id: shiprocketData.order_id,
      status: shiprocketData.status,
      status_code: shiprocketData.status_code
    });

    // Assign AWB to the order
    if (shiprocketData.shipment_id) {
      console.log(`🏷️ Assigning AWB for seller ${sellerGroup.sellerName}, shipment:`, shiprocketData.shipment_id);

      const preferredCourierId = firstItem?.DraftShipments?.courierServiceId;
      const fallbackCourierId = shiprocketData.courier_company_id || null;

      let awbResponse: any | null = null;
      let lastError: any | null = null;

      // 1) Try preferred courier from draft
      if (preferredCourierId) {
        try {
          console.log(`🎯 Attempting AWB with preferred courier ID: ${preferredCourierId}`);
          awbResponse = await shiprocketService.assignAwb({
            shipment_id: shiprocketData.shipment_id,
            courier_id: preferredCourierId,
          });
          console.log(`✅ AWB assigned with preferred courier (${preferredCourierId})`);
        } catch (err: any) {
          lastError = err;
          console.warn(`⚠️ Preferred courier assignment failed, will try fallback. Error: ${err?.message || err}`);
          console.warn(`📋 Error details:`, JSON.stringify(err, null, 2));
        }
      } else {
        console.warn(`⚠️ No preferred courier ID found in DraftShipments.courierServiceId`);
      }

      // 2) Try Shiprocket-provided courier from create order response
      if (!awbResponse && fallbackCourierId && fallbackCourierId !== preferredCourierId) {
        try {
          awbResponse = await shiprocketService.assignAwb({
            shipment_id: shiprocketData.shipment_id,
            courier_id: fallbackCourierId,
          });
          console.log(`✅ AWB assigned with fallback courier from Shiprocket response (${fallbackCourierId})`);
        } catch (err: any) {
          lastError = err;
          console.warn(`⚠️ Fallback courier assignment failed, will try auto-assign. Error: ${err?.message || err}`);
        }
      }

      // 3) Final fallback - let Shiprocket auto-assign without courier
      if (!awbResponse) {
        try {
          console.log("🎯 Attempting AWB with auto-assign (no specific courier)");
          awbResponse = await shiprocketService.assignAwb({
            shipment_id: shiprocketData.shipment_id,
          });
          console.log("✅ AWB assigned with auto-assign (no courier specified)");
        } catch (err: any) {
          console.error("❌ Auto-assign also failed:", err?.message || err);
          throw new Error(`Failed to assign AWB after all attempts. Last error: ${lastError?.message || err?.message}`);
        }
      }

      console.log(`✅ AWB assigned successfully for ${sellerGroup.sellerName}:`, JSON.stringify(awbResponse, null, 2));

      // Update shiprocketData with AWB information and selected courier
      const awbResult = awbResponse as any;
      console.log("🔍 AWB Result structure:", JSON.stringify(awbResult, null, 2));
      
      // Try multiple response structures to extract AWB data
      // Shiprocket API can return data in different structures:
      // 1. { response: { data: { awb_code, courier_company_id, ... } } }
      // 2. { data: { awb_code, courier_company_id, ... } }
      // 3. { awb_code, courier_company_id, ... }
      const awbDataResp = awbResult?.response?.data || awbResult?.data || awbResult || {};
      console.log("🔍 Extracted AWB data:", JSON.stringify(awbDataResp, null, 2));
      
      // Extract AWB code from various possible locations
      const awbCode = awbDataResp.awb_code || awbResult.awb_code || "";
      const courierId = awbDataResp.courier_company_id || awbResult.courier_company_id;
      const courierName = awbDataResp.courier_name || awbResult.courier_name;
      
      console.log("📋 Parsed values:", { awbCode, courierId, courierName });
      
      shiprocketData.awb_code = awbCode;
      shiprocketData.awb_assigned = awbCode ? true : false;
      
      // Persist the actual courier used after assignment for downstream use
      if (courierId) shiprocketData.courier_company_id = courierId;
      if (courierName) shiprocketData.courier_name = courierName;
      
      console.log("📊 Final shiprocketData:", {
        awb_code: shiprocketData.awb_code,
        courier_company_id: shiprocketData.courier_company_id,
        courier_name: shiprocketData.courier_name,
        awb_assigned: shiprocketData.awb_assigned
      });
    }

    return {
      ...shiprocketData,
      sellerGroup,
      success: true
    };
  } catch (error: any) {
    console.error(`❌ Failed to process Shiprocket order for seller ${sellerGroup.sellerName}:`, error);
    return {
      success: false,
      error: error.message,
      sellerGroup
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, payment_id, signature, order_db_id, all_order_ids, cartId } = body;

    const generatedSignature = HmacSHA256(
      order_id + "|" + payment_id,
      process.env.RAZORPAY_KEY_SECRET!
    ).toString(Hex);

    console.log("generatedSignature", generatedSignature);
    console.log("signature", signature);
    if (generatedSignature === signature) {
      console.log("Payment Verified. Updating order status...");

      // Determine which orders to process - handle both single and multiple orders
      const orderIdsToProcess = all_order_ids && all_order_ids.length > 0 ? all_order_ids : [order_db_id];
      console.log("Processing orders:", orderIdsToProcess);

      const processedOrders = [];
      const allShiprocketResults = [];

      // Process each order
      for (const currentOrderId of orderIdsToProcess) {
        if (!currentOrderId) continue;

        const order = await db.order.findUnique({
          where: { id: currentOrderId },
          include: {
            items: {
              include: {
                productVariant: {
                  include: {
                    product: {
                      include: {
                        seller: {
                          include: {
                            Pickuplocation: true,
                          },
                        },
                      },
                    },
                  },
                },
                DraftShipments: true,
              },
            },
            payments: true,
            shippingAddress: true,
            user: true,
          },
        });

        if (!order) {
          console.error(`Order not found: ${currentOrderId}`);
          continue;
        }

        // Update order status
        await db.order.update({
          where: { id: currentOrderId },
          data: { paymentStatus: PaymentStatus.paid },
        });
        // Find existing payment or create a new one
        const existingPayment = await db.payment.findFirst({
          where: {
            orderId: order.id,
            paymentGatewayOrderId: order_id,
          },
        });

        let paymentRecord;
        if (existingPayment) {
          // Update existing payment
          paymentRecord = await db.payment.update({
            where: { id: existingPayment.id },
            data: {
              paymentStatus: PaymentGatewayStatus.completed,
              transactionId: payment_id,
              paymentDate: new Date(),
            },
          });
        } else {
          // Create new payment
          paymentRecord = await db.payment.create({
            data: {
              orderId: order.id,
              paymentGateway: "razorpay",
              paymentStatus: PaymentGatewayStatus.completed,
              paymentGatewayOrderId: order_id,
              transactionId: payment_id,
              amount: order.totalAmount,
              paymentDate: new Date(),
            },
          });
        }

        // Create or update OrderItemPayment records for each order item
        for (const item of order.items) {
          const itemAmount = Number(item.priceAtPurchase);
          const paymentId = paymentRecord.id;

          // Create unique ID for order item payment
          const orderItemPaymentId = `${item.id}_${paymentId}`;

          // Use upsert to either create or update the record
          await db.orderItemPayment.upsert({
            where: {
              id: orderItemPaymentId,
            },
            create: {
              id: orderItemPaymentId,
              orderItemId: item.id,
              paymentId: paymentId,
              amount: itemAmount,
              paymentStatus: PaymentGatewayStatus.completed,
            },
            update: {
              amount: itemAmount,
              paymentStatus: PaymentGatewayStatus.completed,
            },
          });
        }

        console.log(`Successfully updated payment status for order: ${currentOrderId}`);

        // Group items by seller and create Shiprocket orders
        const itemsBySeller = order.items.reduce((acc: any, item: any) => {
          const sellerId = item.productVariant.product.seller.id;
          if (!acc[sellerId]) {
            acc[sellerId] = {
              sellerId: sellerId,
              sellerName: item.productVariant.product.seller.storeName || 'Unknown Seller',
              items: [],
            };
          }
          acc[sellerId].items.push(item);
          return acc;
        }, {});

        console.log(`🏪 Items grouped by seller for order ${currentOrderId}:`, Object.keys(itemsBySeller));
        Object.entries(itemsBySeller).forEach(([sellerId, group]: [string, any]) => {
          console.log(`  Seller ${sellerId} (${group.sellerName}): ${group.items.length} items`);
        });

        const shiprocketResults = await Promise.all(
          Object.values(itemsBySeller).map(async (sellerGroup: any) => {
            const shiprocketOrderResult = await createShiprocketOrderForSeller(
              sellerGroup,
              order
            );

            if (shiprocketOrderResult.success) {
              // Create new shipment record with AWB information
              const shipment = await db.shipments.create({
                data: {
                  pickupLocationId: sellerGroup.items[0].DraftShipments.pickupLocationId,
                  shipmentId: shiprocketOrderResult.shipment_id,
                  orderId: shiprocketOrderResult.order_id,
                  courierServiceId:
                    sellerGroup.items[0].DraftShipments.courierServiceId ||
                    shiprocketOrderResult.courier_company_id,
                  shippingCharge: sellerGroup.items[0].DraftShipments.shippingCharge,
                  AWB: shiprocketOrderResult.awb_code || "",
                  shipmentStatus: "NEW",
                  ManifestUrl: shiprocketOrderResult.manifest_url || null,
                  InvoiceUrl: shiprocketOrderResult.invoice_url || null,
                  LabelUrl: shiprocketOrderResult.label_url || null,
                },
              });

              // Update order item to link to new shipment and remove draft shipment
              for (const item of sellerGroup.items) {
                await db.orderItem.update({
                  where: { id: item.id },
                  data: {
                    shipmentId: shipment.id,
                    draftShipmentsId: null,
                  },
                });
              }

              // Delete the draft shipments for this seller group
              for (const item of sellerGroup.items) {
                await db.draftShipments.delete({
                  where: { id: item.DraftShipments.id },
                });
              }

              return {
                success: true,
                sellerGroup,
                shiprocketOrder: shiprocketOrderResult,
                awbAssigned: shiprocketOrderResult.awb_assigned,
                awbCode: shiprocketOrderResult.awb_code,
              };
            } else {
              return {
                success: false,
                sellerGroup,
                error: shiprocketOrderResult.error,
              };
            }
          })
        );

        // Reduce stock for each item in this order
        for (const item of order.items) {
          try {
            // Update stock quantity using decrement operator
            const variantStock = await db.productVariant.findUnique({
              where: { id: item.productVariantId },
            });

            console.log("before decrement", variantStock);
            const updatedVariant = await db.productVariant.update({
              where: { id: item.productVariantId },
              data: { 
                stockQuantity: {
                  decrement: item.quantity
                }
              }
            });
            console.log("after decrement", updatedVariant);
            console.log(`Decremented stock for variant ${item.productVariantId} by ${item.quantity}. New stock: ${updatedVariant.stockQuantity}`);
          } catch (error) {
            console.error(`Failed to update stock for variant ${item.productVariantId}:`, error);
          }
        }

        processedOrders.push(order);
        allShiprocketResults.push(...shiprocketResults);
      }

      // Delete the cart and cart items (only once, after all orders are processed)
      if (cartId) {
        const deletedCartItems = await db.cartItem.deleteMany({
          where: { cartId: cartId },
        });
        console.log("deletedCartItems", deletedCartItems);
        const deletedCart = await db.shoppingCart.delete({
          where: { id: cartId },
        });
        console.log("deletedCart", deletedCart);
      }

      // Check if all items were processed successfully
      const failedItems = allShiprocketResults.filter(
        (result) => !result.success
      );

      if (failedItems.length > 0) {
        console.error("Some items failed to process:", failedItems);
        return NextResponse.json(
          {
            success: true,
            message: `Payment verified but some Shiprocket orders failed. Processed ${processedOrders.length} orders.`,
            data: {
              processedOrders,
              shiprocketResults: allShiprocketResults,
              failedItems,
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `Payment verified and all Shiprocket orders created. Processed ${processedOrders.length} orders.`,
          data: {
            processedOrders,
            shiprocketResults: allShiprocketResults,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
