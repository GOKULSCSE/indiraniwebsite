import { ProductController } from "@/modules/controllers/ProductController";

export async function POST (request: Request){
    const productController = new ProductController();
    return productController.AddProductVariantDiscount(request);
}

export async function PUT (request: Request){
    const productController = new ProductController();
    return productController.UpdateProductVariantDiscount(request);
}

export async function DELETE (request: Request){
    const productController = new ProductController();
    return productController.DeleteProductVariantDiscount(request);
}

