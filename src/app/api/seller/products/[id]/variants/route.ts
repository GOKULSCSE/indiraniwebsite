import { ProductController } from "@/modules/controllers/ProductController";

const productController = new ProductController();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const productId = params.id;
  
  // Add the productId to the variant data
  const variantData = {
    ...body,
    productId,
  };

  // Use the existing AddProductVariant method
  return await productController.AddProductVariant(new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(variantData)
  }));
} 