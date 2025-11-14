import { ProductController } from "@/modules/controllers/ProductController";

const productController = new ProductController();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Always include discounts and allow unapproved products for seller routes
  return await productController.GetProductById(id, true, true);
}
