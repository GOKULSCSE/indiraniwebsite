import { NextResponse } from "next/server";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { ShippingAddressService } from "../services/shippingAddressService";
import { z } from "zod";
import { ShippingAddressValidation } from "../validations/shippingAddressValidation";
import {SessionUser} from "@/../types/next-auth"

export class ShippingAddressController {
  private shippingAddressService: ShippingAddressService;

  constructor() {
    this.shippingAddressService = new ShippingAddressService();
  }

  async CreateShippingAddress(request: Request) {
    try {
      const body = await request.json();

      const validatedData = ShippingAddressValidation.CreateShippingAddress().parse(body);

      const address = await this.shippingAddressService.CreateShippingAddress(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          address,
          "Shipping address created successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async UpdateShippingAddress(request: Request) {
    try {
      const body = await request.json();

      const validatedData = ShippingAddressValidation.UpdateShippingAddress().parse(body);

      const address = await this.shippingAddressService.UpdateShippingAddress(validatedData);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          address,
          "Shipping address updated successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetAllShippingAddresses(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user = userData ? (JSON.parse(userData) as SessionUser) : null;
      const addresses = await this.shippingAddressService.GetAllShippingAddresses({userId:user?.id});

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          addresses,
          "Shipping addresses fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async GetShippingAddressById(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        throw new Error("Shipping address ID is required");
      }

      const address = await this.shippingAddressService.GetShippingAddressById(id);

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          address,
          "Shipping address fetched successfully"
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
