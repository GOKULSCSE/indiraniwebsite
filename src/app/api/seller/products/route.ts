import { ProductController } from "@/modules/controllers/ProductController";

const productController = new ProductController();

export async function GET(request: Request) {
    return await productController.GetProductsBySeller(request);
}   

export async function POST(request: Request) {
    return await productController.CreateProduct(request);
}

export async function PUT(request: Request) {
    return await productController.UpdateProduct(request);
}

export async function DELETE(request: Request) {
    return await productController.DeleteProduct(request);
}