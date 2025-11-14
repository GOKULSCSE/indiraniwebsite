import { CategoryController } from "@/modules/controllers/CategoryController";
const categoryController = new CategoryController();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    return categoryController.GetCategoryById(request);
  }
  return categoryController.GetAllCategories(request);
}

export async function POST(request: Request) {
  return categoryController.CreateCategory(request);
}

export async function PUT(request: Request) {
  return categoryController.UpdateCategory(request);
}
