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

    const shiprocketService = ShiprocketService.getInstance();
    
    try {
      // Generate label
      const result = await shiprocketService.generateLabel({
        shipment_id: body.shipment_id
      });

      // Check if we have a label URL
      if (!result.label_url) {
        throw new Error('No label URL received from Shiprocket');
      }

      // Update label URL in database
      await prisma.shipments.updateMany({
        where: {
          shipmentId: body.shipment_id[0]
        },
        data: {
          LabelUrl: result.label_url
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          label_url: result.label_url,
          message: 'Label generated successfully'
        }
      });
    } catch (error: any) {
      // Handle specific Shiprocket API errors
      if (error.message?.toLowerCase().includes('label generation failed')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to generate label. Please try again.'
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error('Error generating label:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to generate label'
      },
      { status: 500 }
    );
  }
}
