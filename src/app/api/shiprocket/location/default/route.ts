import { shiprocketController } from "@/modules/controllers/shiprocketcontroller"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  return shiprocketController.setDefaultPickupLocation(request)
} 