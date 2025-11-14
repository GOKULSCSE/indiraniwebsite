import { ProductController } from "@/modules/controllers/ProductController";

const productController = new ProductController();

export async function POST(request: Request) {
    return await productController.AddProductVariantImage(request);
}

export async function DELETE(request: Request) {
    return await productController.DeleteProductVariantImage(request);
}