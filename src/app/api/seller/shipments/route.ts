import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ShiprocketService } from "@/modules/services/shiprocketservice";
import _ from "lodash";

export async function GET(request: NextRequest) {
  const pickupLocationService = ShiprocketService.getInstance();
  try {
    let userData;

    if (
      request.headers.get("x-user") &&
      _.isString(request.headers.get("x-user"))
    ) {
      userData = JSON.parse(request.headers.get("x-user") as string);
    }

    console.log("userData", userData?.sellerId);

    const shipments = await prisma.shipments.findMany({
      where: { shipmentItems: { some: { sellerId: userData?.sellerId } } },
      include: {
        shipmentItems: {
          include: {
            order: true,
            productVariant: {
              include: { product: true, ProductVariantImage: true },
            },
          },
        },
        // Include related order items
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("sellerId", request.headers);
    const shiprocketPickupLocations =
      await pickupLocationService.getPickupLocationsBySeller(
        userData?.sellerId
      );
  
    const mappedShipments = shipments.map((shipment) => {
      return {
        ...shipment,
        // adminStatus and sellerStatus are now included in the shipment object
        shipmentItems: shipment.shipmentItems.map((item) => ({
          ...item,
          productVariant: {
            ...item.productVariant,
            product: item.productVariant?.product,
          },
          order: item.order,
        })),
        pickupLocation: shiprocketPickupLocations.data.shipping_address.find(
          (location: any) => location.id === shipment.pickupLocationId
        ),
      };
    });

    return NextResponse.json({
      success: true,
      shipments: mappedShipments,
    });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch shipments",
      },
      { status: 500 }
    );
  }
}
