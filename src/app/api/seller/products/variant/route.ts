import { ProductController } from "@/modules/controllers/ProductController";
import { NextRequest } from "next/server";


const productController=new ProductController()

export async function POST(request:NextRequest){
    return await productController.AddProductVariant(request)
}

export async function PUT(request:NextRequest){
    return await productController.UpdateProductVariant(request)
}