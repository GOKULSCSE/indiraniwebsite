interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: string;
  discountAmountAtPurchase: string;
  gstAmountAtPurchase: string;
  shippingCharge: string;
  status: string;
  sellerId: string;
  productVariant: {
    title: string;
    price: string;
    ProductVariantImage: { imageUrl: string; isPrimary: boolean }[];
    product: {
      name: string;
      seller?: {
        storeName: string;
      };
    };
  };
}

interface OrderData {
  id: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: string;
  user: {
    name: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string | null;
  };
  items: OrderItem[];
  payments: {
    paymentGateway: string;
    transactionId: string;
    paymentDate: string;
    paymentGatewayOrderId: string | null;
  }[];
  _metadata?: {
    totalOrders: number;
    orderIds: string[];
  };
}

export function generateOrderConfirmationEmail(orderData: OrderData): string {
  // Console log for debugging - BEFORE data processing
  console.log("=== EMAIL TEMPLATE DEBUG - INCOMING DATA ===");
  console.log("Order ID:", orderData.id);
  console.log("Total Amount:", orderData.totalAmount);
  console.log("Order Status:", orderData.orderStatus);
  console.log("Payment Status:", orderData.paymentStatus);
  console.log("Total Items:", orderData.items.length);
  console.log("Total Payments:", orderData.payments.length);
  console.log("Metadata:", orderData._metadata);
  console.log("User:", orderData.user);
  console.log("Shipping Address:", orderData.shippingAddress);
  console.log("All Items:", JSON.stringify(orderData.items, null, 2));
  console.log("All Payments:", JSON.stringify(orderData.payments, null, 2));
  console.log("=== END INCOMING DATA ===");

  const companyName = "Make Easy";
  const companyAddress =
    "Address No.721/2, Venky complex, Second floor, Cross Cut Rd, Coimbatore, Tamil Nadu 641012";
  const supportEmail = "MakeEasy@gmail.com";
  const currentYear = new Date().getFullYear();
  const companyLogoUrl = "https://webnox.blr1.digitaloceanspaces.com/MakeEasy/MakeEasy.png"

  // Calculate totals
  const subtotal = orderData.items.reduce(
    (sum, item) =>
      sum + Number.parseFloat(item.priceAtPurchase) * item.quantity,
    0
  );

  const totalGst = orderData.items.reduce(
    (sum, item) => sum + Number.parseFloat(item.gstAmountAtPurchase || "0"),
    0
  );

  const totalShipping = orderData.items.reduce(
    (sum, item) => sum + Number.parseFloat(item.shippingCharge || "0"),
    0
  );

  // Group items by seller for better organization
  const itemsBySeller = orderData.items.reduce((groups, item) => {
    const sellerId = item.sellerId;
    if (!groups[sellerId]) {
      groups[sellerId] = [];
    }
    groups[sellerId].push(item);
    return groups;
  }, {} as Record<string, OrderItem[]>);

  // Console log for debugging - AFTER data processing
  console.log("=== EMAIL TEMPLATE DEBUG - PROCESSED DATA ===");
  console.log("Calculated Subtotal:", subtotal);
  console.log("Calculated Total GST:", totalGst);
  console.log("Calculated Total Shipping:", totalShipping);
  console.log("Items Grouped by Seller:", Object.keys(itemsBySeller));
  console.log("Seller Groups:", JSON.stringify(itemsBySeller, null, 2));
  
  // Log each seller group details
  Object.entries(itemsBySeller).forEach(([sellerId, items]) => {
    console.log(`Seller ${sellerId}:`);
    console.log(`  - Store Name: ${items[0]?.productVariant?.product?.seller?.storeName || 'Unknown'}`);
    console.log(`  - Items Count: ${items.length}`);
    console.log(`  - Items:`, items.map(item => ({
      id: item.id,
      name: item.productVariant.product.name,
      variant: item.productVariant.title,
      quantity: item.quantity,
      price: item.priceAtPurchase,
      gst: item.gstAmountAtPurchase,
      shipping: item.shippingCharge,
      status: item.status
    })));
  });
  console.log("=== END PROCESSED DATA ===");

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate items HTML grouped by seller
  const itemsHtml = Object.entries(itemsBySeller)
    .map(([sellerId, items]) => {
      const sellerItemsHtml = items
        .map((item) => {
          const primaryImage = item.productVariant.ProductVariantImage.find(
            (img) => img.isPrimary
          );
          return `
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; background-color: #ffffff;">
            <div style="display: flex; align-items: flex-start; gap: 16px;">
              <div style="width: 64px; height: 64px; background-color: #f1f5f9; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <img src="${
                  primaryImage?.imageUrl || "/placeholder.svg?height=64&width=64"
                }" alt="${
            item.productVariant.product.name
          }" style="width: 100%; height: 100%; object-fit: contain; padding: 4px;">
              </div>
              <div style="flex: 1; min-width: 0;">
                <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #1e293b; line-height: 1.4;">${
                  item.productVariant.product.name
                }</h4>
                <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; line-height: 1.3;">${
                  item.productVariant.title
                }</p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <span style="background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500;">Qty: ${
                    item.quantity
                  }</span>
                  <span style="background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; text-transform: capitalize;">${
                    item.status
                  }</span>
                </div>
              </div>
              <div style="text-align: right; flex-shrink: 0;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">₹${Number.parseFloat(
                  item.priceAtPurchase
                ).toFixed(2)}</p>
                <div style="margin-top: 4px; font-size: 10px; color: #64748b;">
                  ${
                    Number.parseFloat(item.gstAmountAtPurchase || "0") > 0
                      ? `<div>+₹${Number.parseFloat(
                          item.gstAmountAtPurchase
                        ).toFixed(2)} GST</div>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
        `;
        })
        .join("");

      return sellerItemsHtml;
    })
    .join("");

  // Remove the order summary information section
  const orderSummaryInfo = '';

  // Read the HTML template and replace placeholders
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Order Confirmation</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
               
             <!-- tick icon -->
            <img src="https://webnox.blr1.digitaloceanspaces.com/Animation%20-%201750070288699.gif" />

                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">Order Confirmed!</h1>
                <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Thank you for your purchase</p>
            </div>
          

            <!-- Order Summary Cards -->
            <div style="padding: 32px 24px 0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px;">
                    <!-- Order Info Card -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                           
                            <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Order Info</h3>
                        </div>
                        <div style="space-y: 4px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                <span style="color: #64748b;">Order ID:</span>
                                <span style="font-family: 'Courier New', monospace; color: #1e293b; font-weight: 500;">${orderData.id.substring(
                                  0,
                                  8
                                )}...</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 12px;">
                                <span style="color: #64748b;">Date:</span>
                                <span style="color: #1e293b;">${new Date(
                                  orderData.createdAt
                                ).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Card -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                           
                            <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Payment</h3>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 4px;">
                                <span style="color: #64748b;">Status:</span>
                                <span style="background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; text-transform: capitalize;">${
                                  orderData.paymentStatus
                                }</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 12px;">
                                <span style="color: #64748b;">Method:</span>
                                <span style="color: #1e293b; text-transform: capitalize;">${
                                  orderData.payments[0]?.paymentGateway || "N/A"
                                }</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${orderSummaryInfo}
            </div>

            <!-- Order Items -->
            <div style="padding: 0 24px 32px;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">Order Items</h3>
                </div>

                ${itemsHtml}
            </div>

            <!-- Order Summary -->
            <div style="padding: 0 24px 32px;">
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                    <div style="display: flex; align-items: center; margin-bottom: 16px;">
                      
                        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">Order Summary</h3>
                    </div>
                    
                    <div style="space-y: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                            <span style="color: #64748b;">Subtotal:</span>
                            <span style="color: #1e293b;">₹${subtotal.toFixed(
                              2
                            )}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                            <span style="color: #64748b;">GST:</span>
                            <span style="color: #1e293b;">₹${totalGst.toFixed(
                              2
                            )}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 16px;">
                            <span style="color: #64748b;">Shipping:</span>
                            <span style="color: #1e293b;">₹${totalShipping.toFixed(
                              2
                            )}</span>
                        </div>
                        <div style="border-top: 1px solid #cbd5e1; padding-top: 16px;">
                            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700;">
                                <span style="color: #1e293b;">Total:</span>
                                <span style="color: #10b981;">₹${Number.parseFloat(
                                  orderData.totalAmount
                                ).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Shipping Address -->
            <div style="padding: 0 24px 32px;">
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                    <div style="display: flex; align-items: center; margin-bottom: 16px;">
                      
                        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">Shipping Address</h3>
                    </div>
                    <div style="color: #475569; font-size: 14px; line-height: 1.6;">
                        <p style="margin: 0 0 4px; font-weight: 600; color: #1e293b;">${
                          orderData.user.name
                        }</p>
                        <p style="margin: 0 0 4px;">${
                          orderData.shippingAddress.street
                        }</p>
                        <p style="margin: 0 0 4px;">${
                          orderData.shippingAddress.city
                        }, ${orderData.shippingAddress.state} ${
    orderData.shippingAddress.zipCode
  }</p>
                        <p style="margin: 0 0 4px;">${
                          orderData.shippingAddress.country
                        }</p>
                        <p style="margin: 0;">Phone: ${
                          orderData.shippingAddress.phone || "N/A"
                        }</p>
                    </div>
                </div>
            </div>

            <!-- Transaction Details -->
            <div style="padding: 0 24px 32px;">
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                    <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1e293b;">Transaction Details</h3>
                    <div style="space-y: 8px; font-size: 14px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #64748b;">Transaction ID:</span>
                            <span style="font-family: 'Courier New', monospace; color: #1e293b; font-weight: 500;">${
                              orderData.payments[0]?.transactionId || "N/A"
                            }</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #64748b;">Gateway Order ID:</span>
                            <span style="font-family: 'Courier New', monospace; color: #1e293b; font-weight: 500;">${
                              orderData.payments[0]?.paymentGatewayOrderId ||
                              "N/A"
                            }</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Payment Date:</span>
                            <span style="color: #1e293b;">${
                              orderData.payments[0]
                                ? formatDate(orderData.payments[0].paymentDate)
                                : "N/A"
                            }</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Call to Action -->
                 <div style="padding: 0 24px 32px; text-align: center;">
                <p style="margin: 0 0 24px; font-size: 16px; color: #475569;">
                    Track your order or contact our support team if you have any questions.
                </p>
                <div style="display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <a href=${
                      process.env.NEXTAUTH_URL + "/profile"
                    } style="margin-right: 10px; display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                        Track Order
                    </a>
                    <a href=${
                      process.env.NEXTAUTH_URL
                    }"} style="display: inline-block; background-color: #ffffff; color: #374151; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #d1d5db;">
                        Continue Shopping
                    </a>
                </div>
            </div>


            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 32px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                <div style="margin-bottom: 16px;">
                  <img src="${companyLogoUrl}" alt="Make Easy" style="width: 150px; height: auto; margin: 0 auto; display: block;">
                   
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                        ${companyAddress}
                    </p>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">
                        Need help? Contact us at 
                        <a href="mailto:${supportEmail}" style="color: #10b981; text-decoration: none; font-weight: 500;">${supportEmail}</a>
                    </p>
                </div>
                
                <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        © ${currentYear} ${companyName}. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  return emailHtml;
}

// Example usage:
// const emailHtml = generateOrderConfirmationEmail(orderData);
// Send this HTML via your email service (Nodemailer, SendGrid, etc.)
