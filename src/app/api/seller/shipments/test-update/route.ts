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

    const { shipmentId } = await request.json();

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, message: "Shipment ID required" },
        { status: 400 }
      );
    }

    // Get the shipment
    const shipment = await prisma.shipments.findFirst({
      where: {
        id: shipmentId,
        shipmentItems: {
          some: {
            sellerId: userData?.sellerId,
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { success: false, message: "Shipment not found" },
        { status: 404 }
      );
    }

    // Check if both documents exist
    const hasInvoice = !!shipment.sellerInvoice;
    const hasEway = !!shipment.sellerEway;

    console.log("Test update check:", {
      shipmentId,
      hasInvoice,
      hasEway,
      currentStatus: shipment.sellerStatus,
      sellerInvoice: shipment.sellerInvoice,
      sellerEway: shipment.sellerEway,
    });

    if (hasInvoice && hasEway && shipment.sellerStatus === 'pending') {
      // Update to approved
      await prisma.shipments.update({
        where: { id: shipmentId },
        data: { sellerStatus: 'approved' },
      });

      return NextResponse.json({
        success: true,
        message: "Status updated to approved",
        updated: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "No update needed",
      updated: false,
      reason: !hasInvoice ? "Missing invoice" : !hasEway ? "Missing e-way" : "Status not pending",
    });
  } catch (error) {
    console.error("Error in test update:", error);
    return NextResponse.json(
      { success: false, message: "Test failed" },
      { status: 500 }
    );
  }
} 