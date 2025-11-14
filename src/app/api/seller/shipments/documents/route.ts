import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import _ from "lodash";

export async function PUT(request: NextRequest) {
  try {
    let userData;

    if (
      request.headers.get("x-user") &&
      _.isString(request.headers.get("x-user"))
    ) {
      userData = JSON.parse(request.headers.get("x-user") as string);
    }

    const body = await request.json();
    const { shipmentId, field, fileUrl } = body;

    // Validate required fields
    if (!shipmentId || !field || !fileUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: shipmentId, field, and fileUrl",
        },
        { status: 400 }
      );
    }

    // Validate field type
    if (!['sellerInvoice', 'sellerEway', 'adminInvoice', 'adminEway'].includes(field)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid field. Must be 'sellerInvoice', 'sellerEway', 'adminInvoice', or 'adminEway'",
        },
        { status: 400 }
      );
    }

    // Validate that the shipment belongs to the seller
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
        {
          success: false,
          message: "Shipment not found or access denied",
        },
        { status: 404 }
      );
    }

    // Get current shipment data to check existing documents
    const currentShipment = await prisma.shipments.findUnique({
      where: { id: shipmentId },
      select: {
        sellerInvoice: true,
        sellerEway: true,
        sellerStatus: true,
        adminInvoice: true,
        adminEway: true,
        adminStatus: true,
      },
    });

    // Prepare update data
    const updateData: any = {
      [field]: fileUrl,
    };

    // Seller status logic - based on INVOICE only (like invoice page)
    // Status logic:
    // - pending: No seller invoice and no admin invoice
    // - approved (sellerUploaded): Seller invoice exists but no admin invoice  
    // - adminUploaded: Admin invoice exists (regardless of seller invoice status)
    // Note: E-way bills do not affect status
    let newSellerStatus = currentShipment?.sellerStatus || 'pending';
    
    if (field === 'sellerInvoice') {
      // If seller invoice is being uploaded
      if (fileUrl) {
        // Check if admin invoice also exists
        if (currentShipment?.adminInvoice && currentShipment.adminInvoice.trim() !== "") {
          newSellerStatus = 'approved'; // Admin invoice exists, so status should be approved
        } else {
          newSellerStatus = 'approved'; // No admin invoice, so status should be approved (seller uploaded)
        }
      } else {
        // If seller invoice is being removed
        if (currentShipment?.adminInvoice && currentShipment.adminInvoice.trim() !== "") {
          newSellerStatus = 'approved'; // Admin invoice exists, so status should be approved
        } else {
          newSellerStatus = 'pending'; // No admin invoice, so status should be pending
        }
      }
    } else if (field === 'sellerEway') {
      // For e-way bills, don't change seller status
      newSellerStatus = currentShipment?.sellerStatus || 'pending';
    }

    // Admin status logic - based on INVOICE only
    let newAdminStatus = currentShipment?.adminStatus || 'pending';
    
    if (field === 'adminInvoice') {
      // If admin invoice is being uploaded
      if (fileUrl) {
        newAdminStatus = 'approved'; // Admin invoice exists, so status should be approved
      } else {
        // If admin invoice is being removed
        if (currentShipment?.sellerInvoice && currentShipment.sellerInvoice.trim() !== "") {
          newAdminStatus = 'pending'; // Only seller invoice exists, so admin status should be pending
        } else {
          newAdminStatus = 'pending'; // No invoices exist, so admin status should be pending
        }
      }
    } else if (field === 'adminEway') {
      // For e-way bills, don't change admin status
      newAdminStatus = currentShipment?.adminStatus || 'pending';
    }

    // Update statuses
    updateData.sellerStatus = newSellerStatus;
    updateData.adminStatus = newAdminStatus;

    // Update the shipment with the document URL and potentially the status
    const updatedShipment = await prisma.shipments.update({
      where: { id: shipmentId },
      data: updateData,
    });

    // Prepare success message based on invoice page logic
    let message = `${field.replace('Invoice', ' Invoice').replace('Eway', ' E-way bill')} uploaded successfully`;
    
    // Show status update message based on what was uploaded
    if (field === 'sellerInvoice') {
      if (fileUrl) {
        // Check if admin invoice also exists
        if (currentShipment?.adminInvoice && currentShipment.adminInvoice.trim() !== "") {
          message += '. Status: Approved (Admin Invoice exists)';
        } else {
          message += '. Status: Approved (Seller Invoice uploaded)';
        }
      }
    } else if (field === 'sellerEway') {
      // For eway uploads, just show success without status change
      message += '. E-way bill uploaded (status unchanged)';
    } else if (field === 'adminInvoice') {
      if (fileUrl) {
        message += '. Status: Approved (Admin Invoice uploaded)';
      }
    } else if (field === 'adminEway') {
      message += '. Admin E-way bill uploaded (status unchanged)';
    }

    return NextResponse.json({
      success: true,
      message: message,
      shipment: updatedShipment,
      sellerStatusUpdated: field === 'sellerInvoice' && fileUrl,
      adminStatusUpdated: field === 'adminInvoice' && fileUrl,
      newSellerStatus: newSellerStatus,
      newAdminStatus: newAdminStatus,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update document",
      },
      { status: 500 }
    );
  }
} 