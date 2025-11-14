import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import _ from "lodash";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userData;

    if (
      request.headers.get("x-user") &&
      _.isString(request.headers.get("x-user"))
    ) {
      userData = JSON.parse(request.headers.get("x-user") as string);
    }

    const { id } = params;
    const body = await request.json();

    // Validate that the shipment belongs to the seller
    const shipment = await prisma.shipments.findFirst({
      where: {
        id: id,
        shipmentItems: {
          some: {
            sellerId: userData?.sellerId,
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipment not found or access denied",
        },
        { status: 404 }
      );
    }

    // Update the shipment status
    const updatedShipment = await prisma.shipments.update({
      where: { id: id },
      data: {
        adminStatus: body.adminStatus,
        sellerStatus: body.sellerStatus,
      },
    });

    return NextResponse.json({
      success: true,
      shipment: updatedShipment,
    });
  } catch (error) {
    console.error("Error updating shipment status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update shipment status",
      },
      { status: 500 }
    );
  }
} 