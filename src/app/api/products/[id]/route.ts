import { ProductController } from "@/modules/controllers/ProductController";

const productController = new ProductController();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; }> }
) {
  const { id } = await params;

    const { searchParams } = new URL(request.url);
    const withDiscounts = searchParams.get("withDiscounts");
    const withDiscountsBool = withDiscounts === "true";
    console.log("withDiscountsBool : ", withDiscountsBool);

  return await productController.GetProductById(id, withDiscountsBool);
}
