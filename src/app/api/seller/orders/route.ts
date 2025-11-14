import { OrderController } from "@/modules/controllers/OrderController";

const orderController = new OrderController();

export async function GET(request: Request) {
    return orderController.getSellerOrderItems(request);
}