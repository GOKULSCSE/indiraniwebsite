import { shiprocketController } from "@/modules/controllers/shiprocketcontroller"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  return shiprocketController.getPickupLocations(request)
}

export async function POST(request: NextRequest) {
  return shiprocketController.createPickupLocation(request)
}
