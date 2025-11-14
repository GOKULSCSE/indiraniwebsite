import { NextRequest, NextResponse } from 'next/server';
import { ShiprocketService } from '@/modules/services/shiprocketservice';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    if (!body.shipment_id || !Array.isArray(body.shipment_id)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request: shipment_id must be an array' 
        }, 
        { status: 400 }
      );
    }

    // Check if shipment exists and has AWB
    const shipment = await prisma.shipments.findFirst({
      where: {
        shipmentId: body.shipment_id[0]
      }
    });

    if (!shipment) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Shipment not found' 
        }, 
        { status: 404 }
      );
    }

    if (!shipment.AWB) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'AWB not assigned for this shipment. Please assign AWB first.' 
        }, 
        { status: 400 }
      );
    }

    if (shipment.shipmentStatus !== 'NEW') {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot schedule pickup: shipment is already ${shipment.shipmentStatus.toLowerCase()}` 
        }, 
        { status: 400 }
      );
    }

    const shiprocketService = ShiprocketService.getInstance();
    
    try {
      const result = await shiprocketService.generatePickup({
        shipment_id: body.shipment_id
      });

      // Update shipment status in database using shipmentId in the where clause
      await prisma.shipments.updateMany({
        where: {
          shipmentId: body.shipment_id[0]
        },
        data: {
          shipmentStatus: 'SCHEDULED'
        }
      });

      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      // Handle specific Shiprocket API errors
      if (error.message?.toLowerCase().includes('awb not assigned')) {
        return NextResponse.json(
          {
            success: false,
            message: 'AWB not assigned for this shipment. Please assign AWB first.'
          },
          { status: 400 }
        );
      }

      throw error; // Re-throw for general error handling
    }
  } catch (error: any) {
    console.error('Error scheduling pickup:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to schedule pickup'
      },
      { status: 500 }
    );
  }
} 