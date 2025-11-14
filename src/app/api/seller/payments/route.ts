import { PaymentController } from "@/modules/controllers/PaymentController";

const paymentController = new PaymentController();

export function GET(request: Request) {
    return paymentController.getSellerPayments(request);
}
