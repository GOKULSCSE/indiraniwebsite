import { NextRequest } from "next/server";
import { SellerController } from "@/modules/controllers/SellerController";

const sellerController = new SellerController();

export async function POST(request: NextRequest) {
  try {

    return sellerController.createGST(request);
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {

    return sellerController.getGST(request);
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    return sellerController.updateGST(request);
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 