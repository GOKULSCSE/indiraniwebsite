import { type NextRequest, NextResponse } from "next/server"
import { ShiprocketService } from "../services/shiprocketservice"
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

export class ShiprocketController {
  private shiprocketService = ShiprocketService.getInstance()

  constructor() {
    this.shiprocketService = new ShiprocketService()
  }

  async authenticate(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      const body = await req.json()
      const token = await this.shiprocketService.authenticate(body)
      return NextResponse.json({ success: true, message: "Login successful", token }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Login failed",
          error: error.message,
        },
        { status: 401 },
      )
    }
  }

  async checkServiceability(req: NextRequest) {
    if (req.method !== "GET") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      const { searchParams } = req.nextUrl

      const paramsObject = Object.fromEntries(
        Array.from(searchParams.entries()).map(([key, value]) => [key.toLowerCase(), value]),
      )

      const requiredParams = ["pickup_postcode", "delivery_postcode", "weight", "cod"]
      const missingParams = requiredParams.filter((param) => !paramsObject[param] && !searchParams.has(param))

      if (missingParams.length > 0) {
        return NextResponse.json(
          { success: false, message: `Missing parameters: ${missingParams.join(", ")}` },
          { status: 400 },
        )
      }

      const params = {
        pickup_postcode: paramsObject.pickup_postcode || searchParams.get("pickup_postcode")!,
        delivery_postcode: paramsObject.delivery_postcode || searchParams.get("delivery_postcode")!,
        weight: Number.parseFloat(paramsObject.weight || searchParams.get("weight")!),
        cod: paramsObject.cod === "1" || paramsObject.cod?.toLowerCase() === "true",
      }

      const result = await this.shiprocketService.checkServiceability(params)
      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Service check failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  async createOrder(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      const orderData = await req.json()
      const result = await this.shiprocketService.createOrder(orderData)

      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Order creation failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  async getPickupLocations(req: NextRequest) {
    if (req.method !== "GET") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      // Get seller ID from headers
      const userHeader = req.headers.get("x-user")
      if (!userHeader) {
        return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
      }

      const userData = JSON.parse(userHeader)
      const sellerId = userData.sellerId

      if (!sellerId) {
        return NextResponse.json({ success: false, message: "Seller ID not found in user data" }, { status: 400 })
      }

      const result = await this.shiprocketService.getPickupLocationsBySeller(sellerId)
      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to get pickup locations",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  async createPickupLocation(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      // Get seller ID from headers
      const userHeader = req.headers.get("x-user")
      if (!userHeader) {
        return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
      }

      const userData = JSON.parse(userHeader)
      const sellerId = userData.sellerId

      if (!sellerId) {
        return NextResponse.json({ success: false, message: "Seller ID not found in user data" }, { status: 400 })
      }

      const locationData = await req.json()

      // Validate required fields
      const requiredFields = [
        "pickup_location",
        "name",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "country",
        "pin_code",
      ]

      const missingFields = requiredFields.filter((field) => !locationData[field])

      if (missingFields.length > 0) {
        return NextResponse.json(
          { success: false, message: `Missing required fields: ${missingFields.join(", ")}` },
          { status: 400 },
        )
      }

      const result = await this.shiprocketService.createPickupLocation(locationData, sellerId)

      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Pickup location creation failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  async checkMultiServiceability(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json(
        { success: false, message: "Method not allowed" },
        { status: 405 }
      );
    }

    try {
      const body = await req.json();
      const { delivery_postcode, cod, items, delivery_state } = body;
      const db = (await import("../../lib/db")).default;

      // Utility to get state from Pickuplocation by pincode
      const getPickupStateFromPincode = async (pincode: string) => {
        const pickup = await db.pickuplocation.findFirst({
          where: { postcode: pincode },
          select: { state: true },
        });
        return pickup?.state || "Unknown";
      };

      // Placeholder for delivery state lookup (should be provided or use a pincode-to-state API)
      const getDeliveryStateFromPincode = async (pincode: string) => {
        if (delivery_state) return delivery_state;
        // TODO: Implement real lookup for all-India
        return "Unknown";
      };

      for (const item of items) {
        const pickupState = await getPickupStateFromPincode(item.pickupPincode);
        const deliveryState = await getDeliveryStateFromPincode(delivery_postcode);
        const isSameState = pickupState && deliveryState && pickupState.toLowerCase().trim() === deliveryState.toLowerCase().trim();
        console.log(`Pickup State: ${pickupState}, Delivery State: ${deliveryState}, Same State: ${isSameState}`);
        // Use isSameState for GST logic
      }

      console.log("🚚 Multi-serviceability check request:", {
        delivery_postcode,
        cod,
        items
      });

      // Validate required fields
      if (!delivery_postcode || typeof cod === "undefined" || !items || !Array.isArray(items)) {
        return NextResponse.json(
          { success: false, message: "Missing required parameters" },
          { status: 400 }
        );
      }

      const results = [];
      
      for (const item of items) {
        const { sellerProfileId, weight, pickupPincode, cartItemId, productVariantId } = item;
        // Use either cartItemId or productVariantId as the identifier for legacy support
        const identifier = cartItemId || productVariantId;
        console.log(`\n📦 Processing seller ${sellerProfileId} with weight ${weight}kg`);
        
        if (!pickupPincode ) {
          console.error(`❌ Missing data for seller ${sellerProfileId}`);
          results.push({
            sellerProfileId,
            success: false,
            error: `serviceability check failed for item` ,
            cartItemId,
            productVariantId,
          });
          continue;
        }

        try {
          // Check serviceability
          console.log(`🔍 Checking serviceability from ${pickupPincode} to ${delivery_postcode}`);
          const serviceability = await this.shiprocketService.checkServiceability({
            pickup_postcode:pickupPincode,
            delivery_postcode,
            weight: Number(weight),
            cod,
          });

          // Validate if we got courier companies
          if (!serviceability?.data?.available_courier_companies?.length) {
            console.error(`❌ No courier services found for seller ${sellerProfileId}`);
            results.push({
              sellerProfileId,
              success: false,
              error: `No courier services available for weight ${weight}kg from ${pickupPincode} to ${delivery_postcode}`,
              cartItemId,
              productVariantId,
            });
            continue;
          }

          console.log(`✅ Found ${serviceability.data.available_courier_companies.length} courier services for seller ${sellerProfileId}`);
          
          // Strict rule: if recommended is available, use it; else use the cheapest by rate
          const companies: any[] = serviceability.data.available_courier_companies || [];
          const recId = serviceability.data.recommended_courier_company_id;

          let selectedCourier: any = null;
          if (recId) {
            selectedCourier = companies.find((c) => c.courier_company_id === recId) || null;
          }

          if (!selectedCourier && companies.length) {
            const sortedByRate = [...companies].sort((a, b) => Number(a.rate) - Number(b.rate));
            selectedCourier = sortedByRate[0];
            console.log(`🔄 Recommended not available, using cheapest: ${selectedCourier.courier_name} (₹${selectedCourier.rate})`);
          } else if (selectedCourier) {
            console.log(`✅ Using recommended courier: ${selectedCourier.courier_name} (₹${selectedCourier.rate})`);
          }

          results.push({
            sellerProfileId,
            success: true,
            data: selectedCourier,
            cartItemId,
            productVariantId,
          });
        } catch (error: any) {
          console.error(`❌ Service check failed for seller ${sellerProfileId}:`, error.message);
          results.push({
            sellerProfileId,
            success: false,
            error: error.message || "Service check failed",
            cartItemId,
            productVariantId,
          });
        }
      }

      console.log("\n📊 Final serviceability results:", results);
      return NextResponse.json({ success: true, data: results }, { status: 200 });
    } catch (error: any) {
      console.error("❌ Multi-serviceability check failed:", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Service check failed",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  async assignAwb(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      const assignData = await req.json()

      // Validate required fields
      if (!assignData.shipment_id) {
        return NextResponse.json({ success: false, message: "Missing required field: shipment_id" }, { status: 400 })
      }

      // Ensure shipment_id is a number
      if (typeof assignData.shipment_id !== "number") {
        assignData.shipment_id = Number.parseInt(assignData.shipment_id)
      }

      const result = await this.shiprocketService.assignAwb(assignData)
      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "AWB assignment failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  async generatePickup(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      const pickupData = await req.json()

      // Validate required fields
      if (!pickupData.shipment_id || !Array.isArray(pickupData.shipment_id)) {
        return NextResponse.json(
          { success: false, message: "Missing required field: shipment_id (must be an array)" },
          { status: 400 },
        )
      }

      // Ensure all shipment_ids are numbers
      pickupData.shipment_id = pickupData.shipment_id.map((id: any) =>
        typeof id === "number" ? id : Number.parseInt(id),
      )

      const result = await this.shiprocketService.generatePickup(pickupData)
      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Pickup generation failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  async generateManifest(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      const manifestData = await req.json()

      // Validate required fields
      if (!manifestData.shipment_id || !Array.isArray(manifestData.shipment_id)) {
        return NextResponse.json(
          { success: false, message: "Missing required field: shipment_id (must be an array)" },
          { status: 400 },
        )
      }

      // Ensure all shipment_ids are numbers
      manifestData.shipment_id = manifestData.shipment_id.map((id: any) =>
        typeof id === "number" ? id : Number.parseInt(id),
      )

      const result = await this.shiprocketService.generateManifest(manifestData)
      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Manifest generation failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  async generatePrint(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      const printData = await req.json()

      // Validate required fields
      if (!printData.order_ids || !Array.isArray(printData.order_ids)) {
        return NextResponse.json(
          { success: false, message: "Missing required field: order_ids (must be an array)" },
          { status: 400 },
        )
      }

      // Ensure all order_ids are numbers
      printData.order_ids = printData.order_ids.map((id: any) => (typeof id === "number" ? id : Number.parseInt(id)))

      const result = await this.shiprocketService.generatePrint(printData)
      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Print generation failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  async generateLabel(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      const labelData = await req.json()

      // Validate required fields
      if (!labelData.shipment_id || !Array.isArray(labelData.shipment_id)) {
        return NextResponse.json(
          { success: false, message: "Missing required field: shipment_id (must be an array)" },
          { status: 400 },
        )
      }

      // Ensure all shipment_ids are numbers
      labelData.shipment_id = labelData.shipment_id.map((id: any) =>
        typeof id === "number" ? id : Number.parseInt(id),
      )

      const result = await this.shiprocketService.generateLabel(labelData)
      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Label generation failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  async generateInvoice(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      const invoiceData = await req.json()

      // Validate required fields
      if (!invoiceData.ids || !Array.isArray(invoiceData.ids)) {
        return NextResponse.json(
          { success: false, message: "Missing required field: ids (must be an array)" },
          { status: 400 },
        )
      }

      // Ensure all ids are numbers
      invoiceData.ids = invoiceData.ids.map((id: any) => (typeof id === "number" ? id : Number.parseInt(id)))

      const result = await this.shiprocketService.generateInvoice(invoiceData)
      return NextResponse.json({ success: true, data: result }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Invoice generation failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  public async trackByAwb(req: NextRequest, awb: string) {
    if (req.method !== "GET") {
      return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 })
    }

    try {
      // Validate AWB format
      if (!awb || typeof awb !== "string" || awb.trim().length === 0) {
        return NextResponse.json({ success: false, message: "Invalid AWB number" }, { status: 400 })
      }

      // Fixed: Use this.shiprocketService instead of shiprocketService
      const trackingData = await this.shiprocketService.trackByAwb(awb.trim())
      return NextResponse.json({ success: true, data: trackingData }, { status: 200 })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Tracking failed",
          error: error.message,
        },
        { status: 500 },
      )
    }
  }

  public async setDefaultPickupLocation(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }

    try {
      const sellerId = req.headers.get("x-seller-id")
      if (!sellerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await req.json()
      const { location_id } = body

      if (!location_id) {
        return NextResponse.json({ error: "Location ID is required" }, { status: 400 })
      }

      // First, set all locations for this seller to non-default
      await db.pickuplocation.updateMany({
        where: { sellerProfileId: sellerId },
        data: { isDefault: false },
      })

      // Find the location first
      const existingLocation = await db.pickuplocation.findFirst({
        where: {
          sellerProfileId: sellerId,
          location_id: location_id,
        },
      })

      if (!existingLocation) {
        return NextResponse.json({ error: "Location not found" }, { status: 404 })
      }

      // Then set the selected location as default
      const pickupLocation = await db.pickuplocation.update({
        where: {
          id: existingLocation.id,
        },
        data: { isDefault: true },
      })

      return NextResponse.json({
        success: true,
        message: "Default pickup location updated successfully",
        data: pickupLocation,
      })
    } catch (error) {
      console.error("Set default pickup location error:", error)
      return NextResponse.json(
        { error: "Failed to set default pickup location" },
        { status: 500 },
      )
    }
  }

  public async addPickupLocation(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }

    try {
      const sellerId = req.headers.get("x-seller-id")
      if (!sellerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await req.json()
      const { location_id, isDefault, pickup_location, name, email, phone, address, city, state, country, pin_code } = body

      if (!location_id) {
        return NextResponse.json({ error: "Location ID is required" }, { status: 400 })
      }

      // Check if this is a new location or an update
      const existingLocation = await db.pickuplocation.findFirst({
        where: {
          sellerProfileId: sellerId,
          location_id: location_id,
        },
      })

      if (existingLocation) {
        // If setting as default, update all other locations to non-default first
        if (isDefault) {
          await db.pickuplocation.updateMany({
            where: { sellerProfileId: sellerId },
            data: { isDefault: false },
          })
        }

        // Update existing location
        const pickupLocation = await db.pickuplocation.update({
          where: {
            id: existingLocation.id,
          },
          data: {
            isDefault: isDefault || false,
          },
        })

        return NextResponse.json({
          success: true,
          message: "Pickup location updated successfully",
          data: pickupLocation,
        })
      } else {
        // For new locations, validate all required fields
        if (!pickup_location || !name || !email || !phone || !address || !city || !state || !country || !pin_code) {
          return NextResponse.json({
            success: false,
            message: "Missing required fields: pickup_location, name, email, phone, address, city, state, country, pin_code",
          }, { status: 400 })
        }

        // If setting as default, update all other locations to non-default first
        if (isDefault) {
          await db.pickuplocation.updateMany({
            where: { sellerProfileId: sellerId },
            data: { isDefault: false },
          })
        }

        // Add new location
        const pickupLocation = await db.pickuplocation.create({
          data: {
            sellerProfileId: sellerId,
            location_id: location_id,
            isDefault: isDefault || false,
            address: address,
            city: city,
            state: state,
            postcode: pin_code,
          },
        })

        return NextResponse.json({
          success: true,
          message: "Pickup location added successfully",
          data: pickupLocation,
        })
      }
    } catch (error) {
      console.error("Add pickup location error:", error)
      return NextResponse.json(
        { error: "Failed to add pickup location" },
        { status: 500 },
      )
    }
  }

  // Admin shipping charge calculation for minimal shipping (single pickup location)
  async checkAdminShippingCharge(req: NextRequest) {
    if (req.method !== "POST") {
      return NextResponse.json(
        { success: false, message: "Method not allowed" },
        { status: 405 }
      );
    }
    try {
      const body = await req.json();
      const { delivery_postcode, items, cod } = body;
      // Fetch admin pickup location from DB
      const adminUser = await db.user.findFirst({
        where: { roleId: "SUPERADMIN" },
        include: {
          sellerProfile: {
            include: { Pickuplocation: true },
          },
        },
      });
      const adminPickup = adminUser?.sellerProfile?.Pickuplocation?.[0];
      if (!adminPickup?.postcode) {
        return NextResponse.json({ success: false, message: "Admin pickup location not found" }, { status: 500 });
      }
      const ADMIN_PICKUP_PINCODE = adminPickup.postcode;
      
      console.log("🚚 Admin Shipping Charge Request:", {
        adminPickupPincode: ADMIN_PICKUP_PINCODE,
        delivery_postcode,
        items,
        cod
      });
      
      if (!delivery_postcode || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
      }
      // Sum all item weights
      const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
      
      console.log("📦 Shiprocket API Payload:", {
        pickup_postcode: ADMIN_PICKUP_PINCODE,
        delivery_postcode,
        weight: totalWeight,
        cod: !!cod,
      });
      
      // Call Shiprocket API
      const serviceability = await this.shiprocketService.checkServiceability({
        pickup_postcode: ADMIN_PICKUP_PINCODE,
        delivery_postcode,
        weight: totalWeight,
        cod: !!cod,
      });
      return NextResponse.json({ success: true, data: serviceability }, { status: 200 });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message || "Admin shipping charge check failed", error: error.message }, { status: 500 });
    }
  }
}

export const shiprocketController = new ShiprocketController()
