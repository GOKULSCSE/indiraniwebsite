import { NextResponse } from "next/server";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { CategoryService } from "../services/CategoryService";
import { z } from "zod";
import { CategoryValidation } from "../validations/CategoryValidation";

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  async CreateCategory(request: Request) {
    try {
      const body = await request.json();

      const validatedData = CategoryValidation.CreateCategory().parse(body);

      const category = await this.categoryService.CreateCategory(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          category,
          "Category created successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async UpdateCategory(request: Request) {
    try {
      const body = await request.json();

      const validatedData = CategoryValidation.UpdateCategory().parse(body);

      const category = await this.categoryService.UpdateCategory(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          category,
          "Category updated successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetAllCategories(request: Request) {
    try {
      const categories = await this.categoryService.GetAllCategories();

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          categories,
          "Categories fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetCategoryById(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        throw new Error("Category ID is required");
      }

      const category = await this.categoryService.GetCategoryById(id);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          category,
          "Category fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): NextResponse {
    console.error(error);
    let errorMessage = "An unknown error occurred";
    let validationError = {};

    if (error instanceof z.ZodError) {
      errorMessage = "Validation Error";
      validationError = error.format();
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      ...ResponseGenerator.generate(500, null, errorMessage, validationError)
    );
  }
}
