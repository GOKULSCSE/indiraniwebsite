import { NextRequest, NextResponse } from 'next/server';
import { ShiprocketService } from '@/modules/services/shiprocketservice';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    if (!body.ids || !Array.isArray(body.ids)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request: ids must be an array' 
        }, 
        { status: 400 }
      );
    }

    const shiprocketService = ShiprocketService.getInstance();
    
    try {
      // Generate invoice
      const result = await shiprocketService.generateInvoice({
        ids: body.ids
      });

      // Check if we have an invoice URL
      if (!result.invoice_url) {
        throw new Error('No invoice URL received from Shiprocket');
      }

      // Find shipment by orderId and update invoice URL
      const shipment = await prisma.shipments.findFirst({
        where: {
          orderId: body.ids[0]
        }
      });

      if (!shipment) {
        throw new Error('Shipment not found for this order');
      }

      // Update invoice URL in database
      await prisma.shipments.updateMany({
        where: {
          orderId: body.ids[0]
        },
        data: {
          InvoiceUrl: result.invoice_url
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          invoice_url: result.invoice_url,
          message: 'Invoice generated successfully'
        }
      });
    } catch (error: any) {
      // Handle specific Shiprocket API errors
      if (error.message?.toLowerCase().includes('invoice generation failed')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to generate invoice. Please try again.'
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to generate invoice'
      },
      { status: 500 }
    );
  }
}
