import { OrderController } from "@/modules/controllers/OrderController";
const orderController = new OrderController();

export async function POST(request: Request) {
  return orderController.CreateOrder(request);
}

export async function GET(request :Request){
    return orderController.GetOrderItems(request)
}
