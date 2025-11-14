import { shiprocketController } from "@/modules/controllers/shiprocketcontroller"

export async function POST(request: Request) {
  return shiprocketController.generatePickup(request as any)
}
