import { NextResponse } from "next/server";
import { PaymentService } from "../services/PaymentService";
import { PaymentValidation } from "../validations/PaymentValidation";
import { ResponseGenerator } from "@/utils/responseGenerator";

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async getSellerPayments(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user: { id: string | null; sellerId: string | null } = userData
        ? JSON.parse(userData)
        : null;

      if (!user?.sellerId) throw new Error("Seller Not Found");

      // Get query parameters
      const url = new URL(request.url);
      const searchParams = new URLSearchParams(url.search);

      // Parse and validate query parameters
      const filters = {
        search: searchParams.get("search") || undefined,
        sortBy:
          (searchParams.get("sortBy") as
            | "createdAt"
            | "amount"
            | "orderItemId") || undefined,
        sortOrder:
          (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
        startDate: searchParams.get("startDate")
          ? new Date(searchParams.get("startDate")!)
          : undefined,
        endDate: searchParams.get("endDate")
          ? new Date(searchParams.get("endDate")!)
          : undefined,
        status:
          (searchParams.get("status") as
            | "total"
            | "paid"
            | "refunded") || undefined,
        limit: searchParams.get("limit")
          ? parseInt(searchParams.get("limit")!)
          : 10,
        offset: searchParams.get("offset")
          ? parseInt(searchParams.get("offset")!)
          : 0,
      };

      const { success, error } =
        PaymentValidation.GetSellerPayments().safeParse(filters);

      if (!success) {
        return NextResponse.json(
          ...ResponseGenerator.generate(
            400,
            null,
            "Validation failed",
            error.format()
          )
        );
      }

      const result = await this.paymentService.getSellerPayments({
        sellerId: user.sellerId,
        filters,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "Seller payments retrieved successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): NextResponse {
    let errorMessage = "An unknown error occurred";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if ("status" in error && typeof (error as any).status === "number") {
        statusCode = (error as any).status;
      }
    }

    return NextResponse.json(
      ...ResponseGenerator.generate(statusCode, null, errorMessage)
    );
  }
}
