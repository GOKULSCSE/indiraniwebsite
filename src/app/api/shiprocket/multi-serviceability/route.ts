import { shiprocketController } from "@/modules/controllers/shiprocketcontroller";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return shiprocketController.checkMultiServiceability(req);
}