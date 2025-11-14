import type {
  ShiprocketAuthResponse,
  ShiprocketPickupLocationPayload,
  ShiprocketAssignAwbPayload,
  ShiprocketGeneratePickupPayload,
  ShiprocketManifestPayload,
  ShiprocketPrintPayload,
  ShiprocketLabelPayload,
  ShiprocketInvoicePayload,
  ShiprocketResponse,
  ShiprocketLocation,
} from "@/types/shiprocket"
import db from "../../lib/db"

export class ShiprocketService {
  private static instance: ShiprocketService
  private readonly baseUrl: string = "https://apiv2.shiprocket.in/v1/external"
  private token: string | null = null
  private tokenExpiry: number | null = null

  private constructor() {}

  public static getInstance(): ShiprocketService {
    if (!ShiprocketService.instance) {
      ShiprocketService.instance = new ShiprocketService()
    }
    return ShiprocketService.instance
  }

  public async authenticate(credentials?: { email?: string; password?: string }): Promise<string> {
    const email = process.env.SHIPROCKET_EMAIL
    const password = process.env.SHIPROCKET_PASSWORD

    if (!email || !password) {
      throw new Error("Shiprocket credentials not configured")
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data: ShiprocketAuthResponse = await response.json()


      // db.shipments.create({data:{currentStatus:"pickuped",shipmentItems:{connect:[1,2,3,4]}}})

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed")
      }

      this.token = data.token
      this.tokenExpiry = Date.now() + data.expires_in * 1000
      return data.token
    } catch (error) {
      console.error("Authentication error:", error)
      throw error
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.token || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
      await this.authenticate()
    }
  }

  public async checkServiceability(data: {
    pickup_postcode: string
    delivery_postcode: string
    weight: number
    cod: boolean
  }): Promise<any> {
    await this.ensureAuthenticated()

    try {
      const params = new URLSearchParams({
        pickup_postcode: data.pickup_postcode,
        delivery_postcode: data.delivery_postcode,
        weight: data.weight.toString(),
        cod: data.cod ? "1" : "0",
      })

      console.log("params", params)

      const response = await fetch(`${this.baseUrl}/courier/serviceability?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("response", response)

      if (!response.ok) {
        throw new Error(`Shiprocket API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Serviceability check error:", error)
      throw new Error("Failed to check serviceability")
    }
  }

  public async createOrder(orderPayload: any): Promise<any> {
    await this.ensureAuthenticated()

    try {
      console.log("Creating order with payload:", orderPayload);
      const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Shiprocket API error:", data);
        throw new Error(data.message || "Failed to create order")
      }

      // Check if we have the expected response format
      if (!data.order_id && !data.shipment_id) {
        console.error("Unexpected response format:", data);
        throw new Error("Invalid response format from Shiprocket API");
      }

      // Return the standardized response
      return {
        order_id: data.order_id,
        shipment_id: data.shipment_id,
        status: data.status || "NEW",
        status_code: data.status_code || 1,
        onboarding_completed_now: data.onboarding_completed_now || 0,
        awb_code: data.awb_code || null,
        courier_company_id: data.courier_company_id || null,
        courier_name: data.courier_name || null
      };
    } catch (error) {
      console.error("Create order error:", error)
      throw error
    }
  }

  public async createPickupLocation(locationData: ShiprocketPickupLocationPayload, sellerId?: string): Promise<any> {
    await this.ensureAuthenticated()

    try {
      console.log('Creating pickup location with data:', locationData);
      
      const response = await fetch(`${this.baseUrl}/settings/company/addpickup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup_location: locationData.pickup_location,
          name: locationData.name,
          email: locationData.email,
          phone: locationData.phone,
          address: locationData.address,
          address_2: locationData.address_2 || "",
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
          pin_code: locationData.pin_code
        }),
      })

      const data = await response.json()
      console.log('Shiprocket API response:', data);

      if (!response.ok || !data.success) {
        console.error('Shiprocket API error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data.message || "Failed to create pickup location")
      }

      if (sellerId) {
        try {
          // Check if this is the first location for the seller
          const existingLocations = await db.pickuplocation.count({
            where: { sellerProfileId: sellerId },
          });

          // Create pickup location in local database
          await db.pickuplocation.create({
            data: {
              location_id: data.pickup_id || data.address_id || data.id,
              sellerProfileId: sellerId,
              postcode: locationData.pin_code,
              isDefault: existingLocations === 0,
            },
          });
        } catch (dbError) {
          console.error('Database error while saving pickup location:', dbError);
          throw new Error('Failed to save pickup location in database');
        }
      }

      return data
    } catch (error) {
      console.error("Create pickup location error:", error)
      throw new Error(error instanceof Error ? error.message : "Shiprocket pickup location creation failed")
    }
  }

  /**
   * Get pickup locations filtered by seller
   */
  public async getPickupLocations(): Promise<ShiprocketResponse<{ shipping_address: ShiprocketLocation[] }>> {
    await this.ensureAuthenticated()

    try {
      const response = await fetch(`${this.baseUrl}/settings/company/pickup`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("token",this.token);
      

      if (!response.ok) {
        throw new Error(`Shiprocket API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Get pickup locations error:", error)
      throw new Error("Failed to get pickup locations")
    }
  }

  public async getPickupLocationsBySeller(sellerProfileId: string): Promise<any> {
    await this.ensureAuthenticated()

    try {
      // Get all pickup locations from Shiprocket
      const response = await fetch(`${this.baseUrl}/settings/company/pickup`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Shiprocket API error: ${response.statusText}`)
      }

      const shiprocketData = await response.json()

      // Get seller's pickup locations from local database
      const localPickupLocations = await db.pickuplocation.findMany({
        where: { sellerProfileId },
      })

      // Filter Shiprocket locations based on local database records
      const sellerLocationIds = localPickupLocations.map((loc) => loc.location_id)
      const allShiprocketLocations = shiprocketData?.data?.shipping_address || []
      const filteredLocations = allShiprocketLocations.filter((location: any) =>
        sellerLocationIds.includes(location.id),
      )

      // Map the locations and add isDefault flag
      const locationsWithDefault = filteredLocations.map((location: any) => {
        const localLocation = localPickupLocations.find(loc => loc.location_id === location.id);
        return {
          ...location,
          postcode: location.pin_code,
          isDefault: localLocation?.isDefault || false,
        };
      });

      return {
        data: {
          shipping_address: locationsWithDefault,
        },
      }
    } catch (error) {
      console.error("Get pickup locations by seller error:", error)
      throw new Error("Failed to get pickup locations for seller")
    }
  }

  public async getSellerPickupPostcode(sellerProfileId: string): Promise<string> {
    try {
      // First try to get the default pickup location
      let pickupLocation = await db.pickuplocation.findFirst({
        where: {
          sellerProfileId,
          isDefault: true,
        },
      });

      // If no default location found, try to get any pickup location for the seller
      if (!pickupLocation) {
        pickupLocation = await db.pickuplocation.findFirst({
          where: {
            sellerProfileId,
          },
        });
      }

      if (!pickupLocation || !pickupLocation.postcode) {
        throw new Error(`No pickup location found for seller: ${sellerProfileId}`);
      }

      return pickupLocation.postcode;
    } catch (error) {
      console.error("Error fetching seller pickup location:", error);
      throw new Error("Failed to get seller pickup location");
    }
  }

  public async assignAwb(assignData: ShiprocketAssignAwbPayload): Promise<ShiprocketResponse<any>> {
    await this.ensureAuthenticated();

    try {
      console.log("🏷️ Assigning AWB with data:", assignData);
      const response = await fetch(`${this.baseUrl}/courier/assign/awb`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignData),
      });

      const data = await response.json();
      console.log("📦 Shiprocket AWB response:", data);

      if (!response.ok) {
        console.error("❌ Shiprocket AWB error:", data);
        throw new Error(data.message || "Failed to assign AWB");
      }

      return data;
    } catch (error) {
      console.error("❌ Assign AWB error:", error);
      throw error;
    }
  }

  public async generatePickup(pickupData: ShiprocketGeneratePickupPayload): Promise<any> {
    await this.ensureAuthenticated()

    try {
      const response = await fetch(`${this.baseUrl}/courier/generate/pickup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pickupData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate pickup")
      }

      return data
    } catch (error) {
      console.error("Generate pickup error:", error)
      throw new Error("Shiprocket pickup generation failed")
    }
  }

  public async generateManifest(manifestData: ShiprocketManifestPayload): Promise<any> {
    await this.ensureAuthenticated()

    try {
      console.log("teken", this.token)
      console.log("data", manifestData)
      console.log("after stringify", JSON.stringify(manifestData))
      console.log("URL", `${this.baseUrl}/generate/manifest`)

      const response = await fetch(`${this.baseUrl}/manifests/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(manifestData),
      })

      const data = await response.json()
      console.log("data : ", data)
      if (data.message=="Manifest already generated.") {
       return {
        ...data,
        isAlreadyGenerated: true,
       }
      }

      return data
    } catch (error) {
      console.error("Generate manifest error:", error)
      throw new Error("Shiprocket manifest generation failed")
    }
  }

  public async generatePrint(printData: ShiprocketPrintPayload): Promise<any> {
    await this.ensureAuthenticated()

    try {
      const response = await fetch(`${this.baseUrl}/manifests/print`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(printData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate print")
      }

      return data
    } catch (error) {
      console.error("Generate print error:", error)
      throw new Error("Shiprocket print generation failed")
    }
  }

  public async generateLabel(labelData: ShiprocketLabelPayload): Promise<any> {
    await this.ensureAuthenticated()

    try {
      const response = await fetch(`${this.baseUrl}/courier/generate/label`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(labelData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate label")
      }

      return data
    } catch (error) {
      console.error("Generate label error:", error)
      throw new Error("Shiprocket label generation failed")
    }
  }

  public async generateInvoice(invoiceData: ShiprocketInvoicePayload): Promise<any> {
    await this.ensureAuthenticated()

    try {
      const response = await fetch(`${this.baseUrl}/orders/print/invoice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate invoice")
      }

      return data
    } catch (error) {
      console.error("Generate invoice error:", error)
      throw new Error("Shiprocket invoice generation failed")
    }
  }

  public async trackByAwb(awb: string): Promise<any> {
    await this.ensureAuthenticated()

    try {
      // Fixed: Added missing slash in the URL
      const response = await fetch(`${this.baseUrl}/courier/track/awb/${awb}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Tracking failed for AWB: ${awb}`)
      }

      return data
    } catch (error) {
      console.error(`Tracking error for AWB ${awb}:`, error)
      throw new Error("Shiprocket tracking failed")
    }
  }

  public async setDefaultPickupLocation(sellerId: string, locationId: number): Promise<any> {
    try {
      // First, set all locations for this seller to non-default
      await db.pickuplocation.updateMany({
        where: { sellerProfileId: sellerId },
        data: { isDefault: false },
      });

      // Then set the selected location as default
      const updatedLocation = await db.pickuplocation.update({
        where: {
          id: (await db.pickuplocation.findFirst({
            where: {
              sellerProfileId: sellerId,
              location_id: locationId,
            },
          }))?.id,
        },
        data: { isDefault: true },
      });

      return updatedLocation;
    } catch (error) {
      console.error("Error setting default pickup location:", error);
      throw new Error("Failed to set default pickup location");
    }
  }

  public async cancelOrder(orderIds: number[]): Promise<any> {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/orders/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: orderIds }),
      });

      const data = await response.json();

      console.log("Shiprocket cancel order response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel order");
      }

      return data;
    } catch (error) {
      console.error("Cancel order error:", error);
      throw new Error("Shiprocket order cancellation failed");
    }
  }

  public async getShipmentCouriers(shipmentId: number): Promise<any> {
    await this.ensureAuthenticated();

    try {
      console.log("🔍 Getting available couriers for shipment:", shipmentId);
      const response = await fetch(`${this.baseUrl}/courier/assign/awb`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("📋 Available couriers response:", data);

      if (!response.ok) {
        console.error("❌ Failed to get available couriers:", data);
        throw new Error(data.message || "Failed to get available couriers");
      }

      return data;
    } catch (error) {
      console.error("❌ Get shipment couriers error:", error);
      throw error;
    }
  }

  public async checkShipmentServiceability(data: {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number;
    cod: boolean;
  }): Promise<any> {
    await this.ensureAuthenticated();

    try {
      const params = new URLSearchParams({
        pickup_postcode: data.pickup_postcode,
        delivery_postcode: data.delivery_postcode,
        weight: data.weight.toString(),
        cod: data.cod ? "1" : "0",
      });

      console.log("🔍 Checking serviceability with params:", params.toString());

      const response = await fetch(`${this.baseUrl}/courier/serviceability?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Shiprocket API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("🚚 Serviceability check result:", JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error("Serviceability check error:", error);
      throw new Error("Failed to check serviceability");
    }
  }
}
