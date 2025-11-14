import { shiprocketController } from "@/modules/controllers/shiprocketcontroller"

export async function POST(request: Request) {
  return shiprocketController.assignAwb(request as any)
}
