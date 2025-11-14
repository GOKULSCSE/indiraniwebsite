import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ShiprocketService } from "@/modules/services/shiprocketservice";
import _ from "lodash";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const pickupLocationService = ShiprocketService.getInstance();
  try {
    let userData;

    if (
      request.headers.get("x-user") &&
      _.isString(request.headers.get("x-user"))
    ) {
      userData = JSON.parse(request.headers.get("x-user") as string);
    }

    const shipment = await prisma.shipments.findUnique({
      where: { id: params.id },
      include: {
        shipmentItems: {
          include: {
            order: true,
            productVariant: {
              include: { product: true, ProductVariantImage: true },
            },
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({
        success: false,
        message: "Shipment not found",
      }, { status: 404 });
    }

    const shiprocketPickupLocations =
      await pickupLocationService.getPickupLocationsBySeller(
        userData?.sellerId
      );

    const mappedShipment = {
      ...shipment,
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

    return NextResponse.json({
      success: true,
      shipment: mappedShipment,
    });
  } catch (error) {
    console.error("Error fetching shipment details:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch shipment details",
      },
      { status: 500 }
    );
  }
}    