import {CartController} from "@/modules/controllers/CartController"
const cartController=new CartController()

export async function GET(request :Request){
    return cartController.UserCart(request)
}

export async function POST(request :Request){
    return cartController.AddToCart(request)
}

export async function DELETE(request :Request){
    return cartController.RemoveCartItems(request)
}

export async function PUT(request :Request){
    return cartController.UpdateCartItem(request)
}