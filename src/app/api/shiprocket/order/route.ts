import { NextRequest, NextResponse } from 'next/server';
import { shiprocketController } from '@/modules/controllers/shiprocketcontroller';

export async function POST(req: NextRequest) {
    return shiprocketController.createOrder(req);
}