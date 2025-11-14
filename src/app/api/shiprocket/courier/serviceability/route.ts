import { shiprocketController } from '@/modules/controllers/shiprocketcontroller';
import { NextRequest, NextResponse } from 'next/server';

shiprocketController
export async function GET(req: NextRequest) {
  return shiprocketController.checkServiceability(req);
}