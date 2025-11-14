import { OrderController } from "@/modules/controllers/OrderController";
import { OrderValidation } from "@/modules/validations/OrderValidation";


export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const orderController = new OrderController();
  return orderController.CancellRequest(request, id);
}