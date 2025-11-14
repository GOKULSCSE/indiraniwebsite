import { NextResponse } from "next/server";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { ReviewService } from "../services/ReviewService";
import { z } from "zod";
import { ReviewValidation } from "../validations/ReviewValidation";

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  async createReview(request: Request,params:{id:string}) {
    try {
      const body = await request.json();

      const validatedData = ReviewValidation.CreateReview().parse({...body,productId:params.id});

      const category = await this.reviewService.createReview(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          category,
          "Review created successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

    async getAllReviews(request: Request,params:{id:string}) {
    try {

      if (!params.id) {
        throw new Error("Product ID is required");
      }

      const reviews = await this.reviewService.getAllReviews(params.id);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          reviews,
          "Reviews fetched successfully"
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
