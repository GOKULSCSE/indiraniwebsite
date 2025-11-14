import { NextRequest, NextResponse } from 'next/server';
import { ShiprocketService } from '@/modules/services/shiprocketservice';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    if (!body.order_ids || !Array.isArray(body.order_ids)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request: order_ids must be an array' 
        }, 
        { status: 400 }
      );
    }

    const shiprocketService = ShiprocketService.getInstance();
    
    try {
      // Generate print manifest
      const result = await shiprocketService.generatePrint({
        order_ids: body.order_ids
      });

      // Check if we have a print URL
      if (!result.url) {
        throw new Error('No print URL received from Shiprocket');
      }

      return NextResponse.json({
        success: true,
        data: {
          url: result.url,
          message: 'Print manifest generated successfully'
        }
      });
    } catch (error: any) {
      // Handle specific Shiprocket API errors
      if (error.message?.toLowerCase().includes('print generation failed')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to generate print manifest. Please try again.'
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error('Error generating print manifest:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to generate print manifest'
      },
      { status: 500 }
    );
  }
}
