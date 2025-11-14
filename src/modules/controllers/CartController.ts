import { NextResponse } from "next/server";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { CartService } from "../services/CartService";
import { z } from "zod";
import { CartValidation } from "../validations/CartValidation";

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  async AddToCart(request: Request) {
    try {
      const body = await request.json();

      const validatedData = CartValidation.AddToCart().parse(body);

      const cart = await this.cartService.AddToCart(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          cart,
          "Items are added to the cart successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async UserCart(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId")!;

      const cart = await this.cartService.UserCart({ userId });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          cart,
          "User Cart fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async RemoveCartItems(request: Request) {
    try {
      const body = await request.json();

      await this.cartService.RemoveCartItems({ ids: body.ids });

      return NextResponse.json(
        ...ResponseGenerator.generate(201, null, "cart items removed")
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async UpdateCartItem(request: Request) {
    try {
      const body = await request.json();

      const validatedData = CartValidation.UpdateCartItem().parse(body);

      const updatedData=await this.cartService.UpdateCartItem(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(201, updatedData, "cart items updated successfully")
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
