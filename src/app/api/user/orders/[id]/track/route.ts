import { OrderController } from "@/modules/controllers/OrderController";
const orderController = new OrderController();

export async function GET(request: Request, { params }: { params: { id: string } }) {
    return orderController.GetOrderItemTrackings(request, params.id);
}