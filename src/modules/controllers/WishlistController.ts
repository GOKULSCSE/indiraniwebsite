import { NextResponse } from "next/server";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { WishlistService } from "../services/WishlistService";
import { z } from "zod";
import { WishlistValidation } from "../validations/WishlistValidation";

export class WishlistController {
  private wishlistService: WishlistService;

  constructor() {
    this.wishlistService = new WishlistService();
  }

  async AddToWishlist(request: Request) {
    try {
      const body = await request.json();

      const validatedData = WishlistValidation.AddToWishlist().parse(body);

      const wishlist = await this.wishlistService.AddToWishlist(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          wishlist,
          "Items are added to the wishlist successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async UserWishlist(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId")!;
      
      // Get pagination parameters if they exist
      const page = searchParams.get("page");
      const limit = searchParams.get("limit");
      
      let paginationParams = {};
      
      // If pagination parameters are provided, add them to the request
      if (page !== null && limit !== null) {
        paginationParams = {
          page: parseInt(page),
          limit: parseInt(limit)
        };
      }

      const wishlist = await this.wishlistService.UserWishlist({ 
        userId,
        ...paginationParams
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          wishlist,
          "User Wishlist fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async RemoveWishlistItems(request: Request) {
    try {
      const body = await request.json();

      const validatedData = WishlistValidation.RemoveFromWishlist().parse(body);

      await this.wishlistService.RemoveWishlistItems({ ids: validatedData.ids });

      return NextResponse.json(
        ...ResponseGenerator.generate(201, null, "wishlist items removed")
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