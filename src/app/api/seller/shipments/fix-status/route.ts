import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import _ from "lodash";

export async function POST(request: NextRequest) {
  try {
    let userData;

    if (
      request.headers.get("x-user") &&
      _.isString(request.headers.get("x-user"))
    ) {
      userData = JSON.parse(request.headers.get("x-user") as string);
    }

    // Find all shipments for this seller where both documents are uploaded but status is still pending
    const shipmentsToUpdate = await prisma.shipments.findMany({
      where: {
        shipmentItems: {
          some: {
            sellerId: userData?.sellerId,
          },
        },
        sellerInvoice: {
          not: null,
        },
        sellerEway: {
          not: null,
        },
        sellerStatus: 'pending',
      },
    });

    console.log(`Found ${shipmentsToUpdate.length} shipments to update`);

    // Update all these shipments to approved status
    const updatePromises = shipmentsToUpdate.map(shipment =>
      prisma.shipments.update({
        where: { id: shipment.id },
        data: { sellerStatus: 'approved' },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Updated ${shipmentsToUpdate.length} shipments to approved status`,
      updatedShipments: shipmentsToUpdate.length,
    });
  } catch (error) {
    console.error("Error fixing shipment statuses:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fix shipment statuses",
      },
      { status: 500 }
    );
  }
} 