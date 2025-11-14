import { OrderController } from "@/modules/controllers/OrderController";
const orderController = new OrderController();

export async function POST(request: Request) {
  const { id } = await request.json();
  return orderController.GetOrderDetailsById(id);
}