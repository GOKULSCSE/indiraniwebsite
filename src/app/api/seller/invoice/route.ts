import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ResponseGenerator } from "@/utils/responseGenerator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sellerId = searchParams.get("sellerId");
    const search = searchParams.get("search"); // Add search parameter
    const invoiceStatus = searchParams.get("invoiceStatus"); // pending, sellerUploaded, adminUploaded

    const skip = (page - 1) * limit;

    // Get seller ID from headers as backup
    const userData = request.headers.get("x-user");
    const user = userData ? JSON.parse(userData) : null;
    const finalSellerId = sellerId || user?.sellerId;

    if (!finalSellerId) {
      return NextResponse.json(
        ...ResponseGenerator.generate(
          400,
          null,
          "Seller ID is required"
        )
      );
    }

    // Build where clause - First let's check if there's any data at all
    const whereClause: any = {};

    // Build the main where clause
    // Temporarily allow multiple statuses for testing
    whereClause.status = { in: ["delivered", "shipped", "pending"] };
    
    // For production, use only delivered:
    // whereClause.status = "delivered";

    // Filter by seller ID - this is the most important filter
    whereClause.sellerId = finalSellerId;

    // Filter by invoice status
    if (invoiceStatus && invoiceStatus !== "all") {
      whereClause.invoiceStatus = invoiceStatus;
    }
    
    console.log("Invoice status filter:", invoiceStatus);
    console.log("Search query:", search);
    console.log("Seller ID:", finalSellerId);
    console.log("Final where clause:", JSON.stringify(whereClause, null, 2));

    // Add search functionality
    if (search && search.trim()) {
      const searchTerms = {
        OR: [
          // Search in store name
          {
            seller: {
              storeName: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          // Search in product name
          {
            productVariant: {
              product: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          // Search in product brand
          {
            productVariant: {
              product: {
                brand: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          // Search in variant title
          {
            productVariant: {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          // Search in order ID (both orderRefId and id)
          {
            order: {
              orderRefId: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            order: {
              id: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          // Search in order item ID (for formatted order ID search)
          {
            id: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      };

      // If we already have OR conditions (from settlement status), we need to combine them
      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR }, // Existing OR conditions (settlement status)
          searchTerms, // New search OR conditions
        ];
        delete whereClause.OR; // Remove the original OR since we're using AND now
      } else {
        // If no existing OR conditions, just add search terms
        Object.assign(whereClause, searchTerms);
      }
    }



    // Get commission percentage for this specific seller
    const commission = await db.commission.findUnique({
      where: { sellerId: finalSellerId }
    });
    const commissionPercentage = commission?.percentage || 0;

    // First, get all order items for this seller to calculate sequential numbering correctly
    const allOrderItems = await db.orderItem.findMany({
      where: {
        sellerId: finalSellerId,
      },
      select: {
        id: true,
        orderId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc", // Order by creation time to maintain consistent numbering
      },
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

    // Fetch order items with related data
    const [orderItems, totalCount] = await Promise.all([
      db.orderItem.findMany({
        where: whereClause,
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
                  brand: true,
                },
              },
              ProductVariantImage: {
                orderBy: {
                  isPrimary: "desc", // Primary images first
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              orderRefId: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          shipment: {
            select: {
              id: true,
              AWB: true,
              shipmentId: true,
              courierServiceId: true,
              LabelUrl: true,
            },
          },
          DraftShipments: {
            select: {
              id: true,
              AWB: true,
              shipmentId: true,
              courierServiceId: true,
              LabelUrl: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.orderItem.count({
        where: whereClause,
      }),
    ]);



    console.log("Raw OrderItems found for seller:", orderItems.length);
    
    // Calculate settlement data for each order item
    const settlementData = orderItems.map((item) => {
      // Base price without GST
      const priceAtPurchase = Number(item.priceAtPurchase);
      const discountAmount = Number(item.discountAmountAtPurchase || 0);
      const shippingCharge = Number(item.shippingCharge || 0);
      
      // Calculate commission amount from base price (excluding GST)
      const commissionAmount = (priceAtPurchase * Number(commissionPercentage)) / 100;
      
      // Calculate amount after commission deduction
      const amountAfterCommission = priceAtPurchase - commissionAmount;
      
      // Calculate GST on the amount after commission
      // GST should be calculated on: (priceAtPurchase - commissionAmount)
      // Get GST percentage dynamically from database - NO HARDCODING
      let gstPercentage = 0;
      
      // Try to get GST percentage from database fields
      if (item.gstAmountAtPurchase) {
        // If gstAmountAtPurchase is a percentage (e.g., 18 for 18%)
        if (Number(item.gstAmountAtPurchase) >= 1 && Number(item.gstAmountAtPurchase) <= 30) {
          gstPercentage = Number(item.gstAmountAtPurchase);
          console.log(`Using GST percentage from gstAmountAtPurchase: ${gstPercentage}% for item ${item.id}`);
        }
      }
      
      // Alternative: try gstAtPurches field
      if (item.gstAtPurches && Number(item.gstAtPurches) >= 1 && Number(item.gstAtPurches) <= 30) {
        gstPercentage = Number(item.gstAtPurches);
        console.log(`Using GST percentage from gstAtPurches: ${gstPercentage}% for item ${item.id}`);
      }
      
      // If no valid GST percentage found in database, calculate from stored GST amount
      if (gstPercentage === 0 && item.gstAmountAtPurchase) {
        // Calculate what percentage the stored GST amount represents of the base price
        const storedGstAmount = Number(item.gstAmountAtPurchase);
        if (storedGstAmount > 0) {
          gstPercentage = (storedGstAmount / priceAtPurchase) * 100;
          console.log(`Calculated GST percentage from stored amount: ${gstPercentage.toFixed(2)}% for item ${item.id}`);
        }
      }
      
      // Calculate GST amount using the dynamic percentage
      const gstAmount = (amountAfterCommission * gstPercentage) / 100;
      
      // Calculate final amount: Amount after commission + GST
      const finalAmount = amountAfterCommission + gstAmount;
      
      // Product total for display (base price + GST on base price)
      const productTotal = priceAtPurchase + Number(item.gstAmountAtPurchase || 0);
      
      // Debug logging to understand the calculation
      console.log(`Invoice Calculation for ${item.id}:`, {
        priceAtPurchase,
        commissionPercentage,
        commissionAmount,
        amountAfterCommission,
        gstAmountAtPurchase: Number(item.gstAmountAtPurchase || 0),
        gstAtPurches: Number(item.gstAtPurches || 0),
        usedGstPercentage: gstPercentage,
        calculatedGstAmount: gstAmount,
        finalAmount,
        productTotal
      });

      // Get primary image or first available image
      const primaryImage = item.productVariant.ProductVariantImage.find(img => img.isPrimary) 
        || item.productVariant.ProductVariantImage[0];

      // Get the formatted order ID from our sequential numbering map
      const formattedOrderId = orderItemSequentialMap.get(item.id) || `100-1`;

      // Get customer information (try from order.user first, then from User relation)
      const customer = item.order.user || item.User;
      const customerName = customer?.name || 
                          (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : '') ||
                          customer?.email || 
                          'Unknown Customer';

      return {
        id: item.id,
        orderId: formattedOrderId, // Use the formatted order ID instead of cleanOrderId
        sellerId: item.sellerId,
        storeName: item.seller.storeName,
        productName: item.productVariant.product.name,
        productBrand: item.productVariant.product.brand,
        variantTitle: item.productVariant.title,
        priceAtPurchase,
        productTotal,
        discountAmount,
        gstAmount,
        shippingCharge,
        commissionPercentage: Number(commissionPercentage),
        commissionAmount,
        finalAmount,
        settlementAmount: Number(item.settlementAmount || finalAmount),
        isSettlement: item.isSettlement,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        productImage: primaryImage?.imageUrl || null,
        // Customer information
        customerName,
        customerEmail: customer?.email || null,
        customerId: customer?.id || null,
        // Invoice related fields
        // Recalculate invoice status to ensure it's always correct
        // Status logic:
        // - adminUploaded: Admin invoice exists with valid URL
        // - sellerUploaded: Seller invoice exists but no valid admin invoice
        // - pending: No valid invoices exist
        // Note: E-way bills and empty strings are not considered for status
        invoiceStatus: (() => {
          // Only consider admin invoice if it has a valid URL (not empty string)
          const hasAdminInvoice = item.adminInvoice && item.adminInvoice.trim() !== "";
          const hasSellerInvoice = item.sellerInvoice && item.sellerInvoice.trim() !== "";
          
          if (hasAdminInvoice) {
            return "adminUploaded";
          } else if (hasSellerInvoice) {
            return "sellerUploaded";
          } else {
            return "pending";
          }
        })(),
        sellerInvoice: item.sellerInvoice,
        sellerEway: item.sellerEway,
        adminInvoice: item.adminInvoice,
        adminEway: item.adminEway,
        // Order date
        orderDate: item.order.createdAt,
        // AWB information
        awb: item.shipment?.AWB || item.DraftShipments?.AWB || null,
        shipmentId: item.shipment?.shipmentId || item.DraftShipments?.shipmentId || null,
        labelUrl: item.shipment?.LabelUrl || item.DraftShipments?.LabelUrl || null,
        hasShipment: !!(item.shipment || item.DraftShipments),
      };
    });

    return NextResponse.json(
      ...ResponseGenerator.generate(
        200,
        {
          data: settlementData,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
        "Settlement data fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching settlement data:", error);
    return NextResponse.json(
      ...ResponseGenerator.generate(
        500,
        null,
        "Failed to fetch settlement data"
      )
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderItemIds, action } = body; // action: 'mark_paid' or 'mark_pending'

    // Get seller ID from headers
    const userData = request.headers.get("x-user");
    const user = userData ? JSON.parse(userData) : null;
    
    if (!user?.sellerId) {
      return NextResponse.json(
        ...ResponseGenerator.generate(
          400,
          null,
          "Seller ID is required"
        )
      );
    }

    if (!orderItemIds || !Array.isArray(orderItemIds) || orderItemIds.length === 0) {
      return NextResponse.json(
        ...ResponseGenerator.generate(
          400,
          null,
          "Order item IDs are required"
        )
      );
    }

    const updateData: any = {};

    if (action === "mark_paid") {
      updateData.isSettlement = true;
    } else if (action === "mark_pending") {
      updateData.isSettlement = false;
      updateData.settlementAmount = null;
    }

    // Update order items - only for the current seller
    const updatedOrderItems = await db.orderItem.updateMany({
      where: {
        id: {
          in: orderItemIds,
        },
        sellerId: user.sellerId, // Only allow updates for current seller's items
        status: "delivered", // Only allow updates for delivered items
      },
      data: updateData,
    });

    return NextResponse.json(
      ...ResponseGenerator.generate(
        200,
        { updatedCount: updatedOrderItems.count },
        `Settlement status updated for ${updatedOrderItems.count} order items`
      )
    );
  } catch (error) {
    console.error("Error updating settlement status:", error);
    return NextResponse.json(
      ...ResponseGenerator.generate(
        500,
        null,
        "Failed to update settlement status"
      )
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderItemId, field, fileUrl } = body;

    // Get seller ID from headers
    const userData = request.headers.get("x-user");
    const user = userData ? JSON.parse(userData) : null;
    
    if (!user?.sellerId) {
      return NextResponse.json(
        ...ResponseGenerator.generate(
          400,
          null,
          "Seller ID is required"
        )
      );
    }

    if (!orderItemId || !field || !['sellerInvoice', 'sellerEway'].includes(field)) {
      return NextResponse.json(
        ...ResponseGenerator.generate(
          400,
          null,
          "Invalid parameters"
        )
      );
    }

    // Get current order item to check existing invoice status
    const currentOrderItem = await db.orderItem.findUnique({
      where: {
        id: orderItemId,
        sellerId: user.sellerId,
      },
      select: {
        sellerInvoice: true,
        adminInvoice: true,
        invoiceStatus: true,
      },
    });

    if (!currentOrderItem) {
      return NextResponse.json(
        ...ResponseGenerator.generate(
          404,
          null,
          "Order item not found"
        )
      );
    }

    // Update the order item with the file URL
    const updateData: any = {};
    updateData[field] = fileUrl || null;

    // Calculate new invoice status based on seller and admin invoices only
    // Status logic:
    // - pending: No seller invoice and no admin invoice
    // - sellerUploaded: Seller invoice exists but no admin invoice
    // - adminUploaded: Admin invoice exists (regardless of seller invoice status)
    // Note: E-way bills do not affect invoice status
    let newInvoiceStatus = "pending";
    
    if (field === 'sellerInvoice') {
      // If seller invoice is being uploaded
      if (fileUrl) {
        // Check if admin invoice also exists
        if (currentOrderItem.adminInvoice && currentOrderItem.adminInvoice.trim() !== "") {
          newInvoiceStatus = "adminUploaded";
        } else {
          newInvoiceStatus = "sellerUploaded";
        }
      } else {
        // If seller invoice is being removed
        if (currentOrderItem.adminInvoice && currentOrderItem.adminInvoice.trim() !== "") {
          newInvoiceStatus = "adminUploaded";
        } else {
          newInvoiceStatus = "pending";
        }
      }
    } else if (field === 'sellerEway') {
      // For e-way bills, don't change invoice status
      newInvoiceStatus = currentOrderItem.invoiceStatus || "pending";
    }

    // Update invoice status
    updateData.invoiceStatus = newInvoiceStatus;

    const updatedOrderItem = await db.orderItem.update({
      where: {
        id: orderItemId,
        sellerId: user.sellerId, // Only allow updates for current seller's items
      },
      data: updateData,
    });

    return NextResponse.json(
      ...ResponseGenerator.generate(
        200,
        {
          ...updatedOrderItem,
          invoiceStatus: newInvoiceStatus as string,
        },
        `${field === 'sellerInvoice' ? 'Invoice' : 'E-way bill'} updated successfully`
      )
    );
  } catch (error) {
    console.error("Error updating invoice file:", error);
    return NextResponse.json(
      ...ResponseGenerator.generate(
        500,
        null,
        "Failed to update invoice file"
      )
    );
  }
} 