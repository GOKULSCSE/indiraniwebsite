import { NextResponse } from "next/server";
import { SellerService } from "../services/SellerService";
import { SellerValidation } from "../validations/SellerValidation";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { ZodError } from "zod";

export class SellerController {
  private sellerService: SellerService;

  constructor() {
    this.sellerService = new SellerService();
  }

  async RegisterSeller(request: Request) {
    try {
      const body = await request.json();
      
      const { success, error, data } = SellerValidation.RegisterSeller().safeParse(body);

      if (!success) {
        console.log(error.format());
        return NextResponse.json(
          ...ResponseGenerator.generate(
            400,
            null,
            "Validation failed",
            error.format()
          )
        );
      }

      const result = await this.sellerService.registerSeller(data);
      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          result,
          "Seller registered successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async getSellerProfile(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      console.log("userData🤞🤞",userData);
      const user: { id: string | null ,sellerId:string|null} = userData ? JSON.parse(userData) : null;

      console.log("user🤞🤞",user);

      if(!user?.sellerId) throw new Error("User Not Found")
      

      const seller=await this.sellerService.getSellerProfile({id:user.sellerId})

      return NextResponse.json(...ResponseGenerator.generate(200,seller))
     
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async updateSellerProfile(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user: { id: string | null, sellerId: string | null } = userData ? JSON.parse(userData) : null;

      if (!user?.sellerId) throw new Error("User Not Found");

      const body = await request.json();
      const { success, error, data } = SellerValidation.UpdateSellerProfile().safeParse(body);

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

      // Validate mobile number format if provided
      if (data.mobileNumber && !/^\d{10}$/.test(data.mobileNumber)) {
        return NextResponse.json(
          ...ResponseGenerator.generate(
            400,
            null,
            "Invalid mobile number format. Must be 10 digits."
          )
        );
      }

      // Validate alternate mobile number if provided
      if (data.alternateMobileNumber && !/^\d{10}$/.test(data.alternateMobileNumber)) {
        return NextResponse.json(
          ...ResponseGenerator.generate(
            400,
            null,
            "Invalid alternate mobile number format. Must be 10 digits."
          )
        );
      }

      const result = await this.sellerService.updateSellerProfile({
        id: user.sellerId,
        data,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "Seller profile updated successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async updateBankInfo(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user: { id: string | null, sellerId: string | null } = userData ? JSON.parse(userData) : null;

      if (!user?.sellerId) throw new Error("User Not Found");

      const body = await request.json();
      const { success, error, data } = SellerValidation.UpdateBankInfo().safeParse(body);

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

      const result = await this.sellerService.updateBankInfo({
        id: user.sellerId,
        data,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "Bank info updated successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async createGST(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user: { id: string | null, sellerId: string | null } = userData ? JSON.parse(userData) : null;

      if (!user?.sellerId) throw new Error("User Not Found");

      const body = await request.json();
      const { success, error, data } = SellerValidation.CreateGST().safeParse(body);

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

      const result = await this.sellerService.createGST({
        sellerId: user.sellerId,
        data,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          201,
          result,
          "GST record created successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async getGST(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user: { id: string | null, sellerId: string | null } = userData ? JSON.parse(userData) : null;

      if (!user?.sellerId) throw new Error("User Not Found");

      const result = await this.sellerService.getGST({
        sellerId: user.sellerId,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "GST record fetched successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async updateGST(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user: { id: string | null, sellerId: string | null } = userData ? JSON.parse(userData) : null;

      if (!user?.sellerId) throw new Error("User Not Found");

      const body = await request.json();
      const { success, error, data } = SellerValidation.UpdateGST().safeParse(body);

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

      const result = await this.sellerService.updateGST({
        sellerId: user.sellerId,
        data,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "GST record updated successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): NextResponse {
    console.error(error);
    let errorMessage = "An unknown error occurred";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if ('status' in error && typeof (error as any).status === 'number') {
        statusCode = (error as any).status;
      }
    }

    return NextResponse.json(
      ...ResponseGenerator.generate(statusCode, null, errorMessage)
    );
  }
}
