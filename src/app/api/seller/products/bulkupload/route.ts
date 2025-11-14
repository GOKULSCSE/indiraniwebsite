import { ProductController } from "@/modules/controllers/ProductController";
import { NextResponse } from "next/server";

const productController = new ProductController();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL is required" },
        { status: 400 }
      );
    }

    const result = await productController.BulkUploadProducts(fileUrl, request);
    return result;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}   