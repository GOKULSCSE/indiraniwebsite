import type {
  ShiprocketLocationPayload,
  ShiprocketOrderPayload,
  ShiprocketLocationResponse,
  ShiprocketOrderResponse,
  ShiprocketPickupLocationPayload,
  ShiprocketPickupLocationResponse,
  ShiprocketAssignAwbPayload,
  ShiprocketAssignAwbResponse,
  ShiprocketGeneratePickupPayload,
  ShiprocketGeneratePickupResponse,
  ShiprocketManifestPayload,
  ShiprocketManifestResponse,
  ShiprocketPrintPayload,
  ShiprocketPrintResponse,
  ShiprocketLabelPayload,
  ShiprocketLabelResponse,
  ShiprocketInvoicePayload,
  ShiprocketInvoiceResponse,
} from "@/types/shiprocket"

class ShiprocketClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api/shiprocket"
  }





  

  /**
   * Authenticate with Shiprocket
   */
  async authenticate(credentials?: { email?: string; password?: string }) {
    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials || {}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed")
      }

      return data
    } catch (error) {
      console.error("Shiprocket authentication error:", error)
      throw error
    }
  }

  /**
   * Check serviceability for delivery
   */
  async checkServiceability(params: ShiprocketLocationPayload): Promise<ShiprocketLocationResponse> {
    try {
      const searchParams = new URLSearchParams({
        pickup_postcode: params.pickup_postcode,
        delivery_postcode: params.delivery_postcode,
        weight: params.weight.toString(),
        cod: params.cod ? "1" : "0",
      })

      const response = await fetch(`${this.baseUrl}/serviceability?${searchParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Serviceability check failed")
      }

      return data.data
    } catch (error) {
      console.error("Shiprocket serviceability error:", error)
      throw error
    }
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: ShiprocketOrderPayload): Promise<ShiprocketOrderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Order creation failed")
      }

      return data.data
    } catch (error) {
      console.error("Shiprocket order creation error:", error)
      throw error
    }
  }

  /**
   * Create a new order with proper validation
   */
  async createOrderWithValidation(orderData: Partial<ShiprocketOrderPayload>): Promise<ShiprocketOrderResponse> {
    try {
      const formattedOrder = formatOrderData(orderData)
      return await this.createOrder(formattedOrder)
    } catch (error) {
      console.error("Order validation error:", error)
      throw error
    }
  }

  /**
   * Get available courier companies for a route
   */
  async getCourierCompanies(params: ShiprocketLocationPayload) {
    try {
      const serviceabilityData = await this.checkServiceability(params)
      return serviceabilityData.data?.available_courier_companies || []
    } catch (error) {
      console.error("Error fetching courier companies:", error)
      throw error
    }
  }

  /**
   * Calculate shipping cost
   */
  async calculateShippingCost(params: ShiprocketLocationPayload) {
    try {
      const courierCompanies = await this.getCourierCompanies(params)

      if (courierCompanies.length === 0) {
        throw new Error("No courier companies available for this route")
      }

      // Return the cheapest option
      const cheapestOption = courierCompanies.reduce((prev, current) =>
        prev.total_charge < current.total_charge ? prev : current,
      )

      return {
        cheapest: cheapestOption,
        all_options: courierCompanies,
      }
    } catch (error) {
      console.error("Error calculating shipping cost:", error)
      throw error
    }
  }

  /**
   * Get available pickup locations
   */
  async getPickupLocations(sellerId?: string) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      // Add seller authentication if provided
      if (sellerId) {
        headers["x-user"] = JSON.stringify({ sellerId })
      }

      const response = await fetch(`${this.baseUrl}/pickup-locations`, {
        method: "GET",
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get pickup locations")
      }

      return data.data
    } catch (error) {
      console.error("Error fetching pickup locations:", error)
      throw error
    }
  }

  /**
   * Create a new pickup location
   */
  async createPickupLocation(
    locationData: ShiprocketPickupLocationPayload,
    sellerId?: string,
  ): Promise<ShiprocketPickupLocationResponse> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      // Add seller authentication if provided
      if (sellerId) {
        headers["x-user"] = JSON.stringify({ sellerId })
      }

      const response = await fetch(`${this.baseUrl}/location`, {
        method: "POST",
        headers,
        body: JSON.stringify(locationData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create pickup location")
      }

      return data.data
    } catch (error) {
      console.error("Error creating pickup location:", error)
      throw error
    }
  }

  /**
   * Assign AWB to shipment
   */
  async assignAwb(assignData: ShiprocketAssignAwbPayload): Promise<ShiprocketAssignAwbResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/courier/assign/awb`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign AWB")
      }

      return data.data
    } catch (error) {
      console.error("Error assigning AWB:", error)
      throw error
    }
  }

  /**
   * Generate pickup request for shipments
   */
  async generatePickup(pickupData: ShiprocketGeneratePickupPayload): Promise<ShiprocketGeneratePickupResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/courier/generate/pickup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pickupData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate pickup")
      }

      return data.data
    } catch (error) {
      console.error("Error generating pickup:", error)
      throw error
    }
  }

  /**
   * Generate manifest for shipments
   */
  async generateManifest(manifestData: ShiprocketManifestPayload): Promise<ShiprocketManifestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/manifest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(manifestData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate manifest")
      }

      return data.data
    } catch (error) {
      console.error("Error generating manifest:", error)
      throw error
    }
  }

  /**
   * Generate print documents for orders
   */
  async generatePrint(printData: ShiprocketPrintPayload): Promise<ShiprocketPrintResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/print`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(printData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate print")
      }

      return data.data
    } catch (error) {
      console.error("Error generating print:", error)
      throw error
    }
  }

  /**
   * Generate shipping labels for shipments
   */
  async generateLabel(labelData: ShiprocketLabelPayload): Promise<ShiprocketLabelResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/label`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(labelData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate label")
      }

      return data.data
    } catch (error) {
      console.error("Error generating label:", error)
      throw error
    }
  }

  /**
   * Generate invoice for orders
   */
  async generateInvoice(invoiceData: ShiprocketInvoicePayload): Promise<ShiprocketInvoiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate invoice")
      }

      return data.data
    } catch (error) {
      console.error("Error generating invoice:", error)
      throw error
    }
  }

  // Add to your existing Shiprocket class
  async trackByAwb(awb: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/tracking/${awb}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Tracking failed")
      }

      return data.data
    } catch (error) {
      console.error("Shiprocket tracking error:", error)
      throw error
    }
  }

  /**
   * Complete order workflow: Create order -> Assign AWB -> Generate pickup
   */
  async completeOrderWorkflow(orderData: Partial<ShiprocketOrderPayload>) {
    try {
      // Step 1: Create order
      const orderResult = await this.createOrderWithValidation(orderData)

      if (!orderResult.shipment_id) {
        throw new Error("Order created but no shipment_id received")
      }

      // Step 2: Assign AWB
      const awbResult = await this.assignAwb({ shipment_id: orderResult.shipment_id })

      // Step 3: Generate pickup
      const pickupResult = await this.generatePickup({ shipment_id: [orderResult.shipment_id] })

      return {
        order: orderResult,
        awb: awbResult,
        pickup: pickupResult,
      }
    } catch (error) {
      console.error("Error in complete order workflow:", error)
      throw error
    }
  }

  /**
   * Complete document generation workflow
   */
  async generateAllDocuments(shipmentId: number, orderId: number) {
    try {
      const [manifest, label, print, invoice] = await Promise.all([
        this.generateManifest({ shipment_id: [shipmentId] }),
        this.generateLabel({ shipment_id: [shipmentId] }),
        this.generatePrint({ order_ids: [orderId] }),
        this.generateInvoice({ ids: [orderId] }),
      ])

      return {
        manifest,
        label,
        print,
        invoice,
      }
    } catch (error) {
      console.error("Error generating documents:", error)
      throw error
    }
  }
}

// Export singleton instance
export const shiprocket = new ShiprocketClient()

// Export class for custom instances
export { ShiprocketClient }

/**
 * Validate and format order data for Shiprocket API
 */
export const formatOrderData = (orderData: Partial<ShiprocketOrderPayload>): ShiprocketOrderPayload => {
  // Ensure required fields are present
  const requiredFields = [
    "order_id",
    "order_date",
    "pickup_location",
    "billing_customer_name",
    "billing_last_name",
    "billing_address",
    "billing_city",
    "billing_pincode",
    "billing_state",
    "billing_country",
    "billing_email",
    "billing_phone",
    "order_items",
    "payment_method",
    "sub_total",
    "weight",
  ]

  for (const field of requiredFields) {
    if (!orderData[field as keyof ShiprocketOrderPayload]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Format the order data with proper defaults
  const formattedOrder: ShiprocketOrderPayload = {
    order_id: orderData.order_id!,
    order_date: orderData.order_date!,
    pickup_location: orderData.pickup_location!,
    comment: orderData.comment || "",
    billing_customer_name: orderData.billing_customer_name!,
    billing_last_name: orderData.billing_last_name!,
    billing_address: orderData.billing_address!,
    billing_address_2: orderData.billing_address_2 || "",
    billing_city: orderData.billing_city!,
    billing_pincode: String(orderData.billing_pincode!),
    billing_state: orderData.billing_state!,
    billing_country: orderData.billing_country!,
    billing_email: orderData.billing_email!,
    billing_phone: String(orderData.billing_phone!),
    shipping_is_billing: orderData.shipping_is_billing ?? true,
    shipping_customer_name: orderData.shipping_customer_name || "",
    shipping_last_name: orderData.shipping_last_name || "",
    shipping_address: orderData.shipping_address || "",
    shipping_address_2: orderData.shipping_address_2 || "",
    shipping_city: orderData.shipping_city || "",
    shipping_pincode: orderData.shipping_pincode || "",
    shipping_country: orderData.shipping_country || "",
    shipping_state: orderData.shipping_state || "",
    shipping_email: orderData.shipping_email || "",
    shipping_phone: orderData.shipping_phone || "",
    order_items: orderData.order_items!.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.units,
      selling_price: item.selling_price,
      discount: item.discount || 0,
      tax: item.tax || 0,
      hsn: item.hsn,
    })),
    payment_method: orderData.payment_method!,
    shipping_charges: orderData.shipping_charges || 0,
    giftwrap_charges: orderData.giftwrap_charges || 0,
    transaction_charges: orderData.transaction_charges || 0,
    total_discount: orderData.total_discount || 0,
    sub_total: orderData.sub_total!,
    length: orderData.length || 10,
    breadth: orderData.breadth || 10,
    height: orderData.height || 10,
    weight: orderData.weight!,
  }

  return formattedOrder
}

/**
 * Validate and format pickup location data
 */
export const formatPickupLocationData = (
  locationData: Partial<ShiprocketPickupLocationPayload>,
): ShiprocketPickupLocationPayload => {
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

  for (const field of requiredFields) {
    if (!locationData[field as keyof ShiprocketPickupLocationPayload]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  return {
    pickup_location: locationData.pickup_location!,
    name: locationData.name!,
    email: locationData.email!,
    phone: locationData.phone!,
    address: locationData.address!,
    address_2: locationData.address_2 || "",
    city: locationData.city!,
    state: locationData.state!,
    country: locationData.country!,
    pin_code: locationData.pin_code!,
  }
}

export const formatShippingCost = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

export const getEstimatedDeliveryDate = (days: string): string => {
  const deliveryDays = Number.parseInt(days) || 7
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays)

  return deliveryDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
