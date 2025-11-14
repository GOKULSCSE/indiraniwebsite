import { OrderController } from "@/modules/controllers/OrderController";
const orderController = new OrderController();

export async function GET(request :Request,{params}:{params:{id:string}}){
    return orderController.GetSellerOrderDetails(request,params)
}

export async function PATCH(request :Request,{params}:{params:{id:string}}){
    return orderController.UpdateSellerOrderStatus(request,params)
}