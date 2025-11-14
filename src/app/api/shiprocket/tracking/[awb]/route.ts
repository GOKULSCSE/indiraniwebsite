import { shiprocketController } from "@/modules/controllers/shiprocketcontroller"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { awb: string } }) {
  return shiprocketController.trackByAwb(request, params.awb)
}
