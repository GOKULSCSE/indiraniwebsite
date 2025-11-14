import { ProductController } from "@/modules/controllers/ProductController";

const productController = new ProductController();

export function POST (request:Request){

    return productController.GetProductVariantById(request)
}