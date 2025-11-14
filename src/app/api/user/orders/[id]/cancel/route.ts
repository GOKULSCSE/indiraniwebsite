import { OrderController } from "@/modules/controllers/OrderController";
import { NextResponse } from "next/server";

const orderController = new OrderController();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  console.log(id);
  if (!id) {
    return new NextResponse("Order ID is required", { status: 400 });
  }
  return orderController.CancelOrderItem(request, id);
}
