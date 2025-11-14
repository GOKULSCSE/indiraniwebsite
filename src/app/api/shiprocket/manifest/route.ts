import { NextRequest, NextResponse } from "next/server";
import { ShiprocketService } from "@/modules/services/shiprocketservice";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    if (!body.shipment_id || !Array.isArray(body.shipment_id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request: shipment_id must be an array",
        },
        { status: 400 }
      );
    }

    const shiprocketService = ShiprocketService.getInstance();

    try {
      // Generate manifest

      console.log("shipment_id:", body.shipment_id);

      let fromDb = await prisma.shipments.findMany({
        where: {
          shipmentId: body.shipment_id[0],
        },
      });

      if (fromDb.length > 0 && fromDb[0].ManifestUrl) {
        return NextResponse.json({
          success: true,
          data: {
            manifest_url: fromDb[0].ManifestUrl,
            message: "Manifest already generated data is from db",
          },
        });
      }

      let result = await shiprocketService.generateManifest({
        shipment_id: body.shipment_id,
      });

      console.log("Manifest result:", result);

      // Check if we have a manifest URL
      // if (!result.manifest_url) {
      //   throw new Error('No manifest URL received from Shiprocket');
      // }

      if (!result?.manifest_url) {
        const printResult = await shiprocketService.generatePrint({
          order_ids: body.order_ids,
        });

        console.log("Print result:", printResult);

        result.manifest_url = printResult.manifest_url;
      }

      // Update manifest URL in database
      await prisma.shipments.updateMany({
        where: {
          shipmentId: body.shipment_id[0],
        },
        data: {
          ManifestUrl: result.manifest_url,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          manifest_url: result.manifest_url,
          message: "Manifest generated successfully",
        },
      });
    } catch (error: any) {
      // Handle specific Shiprocket API errors
      if (error.message?.toLowerCase().includes("manifest generation failed")) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to generate manifest. Please try again.",
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error("Error generating manifest:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate manifest",
      },
      { status: 500 }
    );
  }
}
