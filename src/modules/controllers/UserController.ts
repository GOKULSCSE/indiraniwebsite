import { NextResponse } from "next/server";
import { IUser } from "../models/User";
import { z, ZodError } from "zod";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { UserValidation } from "../validations/UserValidation";
import { UserService } from "../services/UserService";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export class UserController {
  userService: UserService;
  Secret;
  Roles;

  constructor() {
    this.userService = new UserService();
    this.Secret = process.env.NEXTAUTH_SECRET;
    this.Roles = Role;
  }

  async RegisterUser(req: Request) {
    try {
      const body = await req.json();
      // const baseUrl = req.headers.get("origin") || "http://localhost:3000";
      const baseUrl = process.env.NEXTAUTH_URL!;

      const { data, success, error } =
        UserValidation.RegisterUser().safeParse(body);

      if (!success) {
        console.log(error.format());
        return NextResponse.json(
          ...ResponseGenerator.generate(
            400,
            null,
            "Bad Request",
            error.format()
          )
        );
      }
      const res = await this.userService.registerUser({
        userData: body,
        baseUrl,
      });

      return NextResponse.json(
        ResponseGenerator.generate(200, res, "User Registred Successfully")
      );
    } catch (error: unknown) {
      console.error(error);
      return this.handleError(error);
    }
  }

  async LoginWithPassword(credential: Pick<IUser, "email" | "password">) {
    return this.userService.LoginWithPassword({ ...credential });
  }

  async verifyUserAccount(req: Request) {
    try {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");

      if (!token) {
        return NextResponse.json(
          ResponseGenerator.generate(
            400,
            null,
            "Verification token is required"
          )
        );
      }

      const decoded = jwt.verify(token, this.Secret!) as { id: string };
      const result = await this.userService.verifyUserAccount(decoded.id);

      return NextResponse.redirect(
        "http://localhost:3003/auth/verification/success"
      );
    } catch (error) {
      console.log(error);
      return NextResponse.redirect(
        "http://localhost:3003/auth/verification/invalid"
      );
    }
  }

  async getVerificationToken({ email }: Pick<IUser, "email">) {
    return this.userService.getVerificationToken({ email });
  }

  async createUserAccount(userData: IUser) {
    return await this.userService.createUserAccount(userData);
  }

  async getUserAccount(userData: Pick<IUser, "email" | "id">) {
    return await this.userService.getUserAccount(userData);
  }

  async getUserProfile(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      console.log(userData);
      const user: { id: string | null } = userData
        ? JSON.parse(userData)
        : null;

      if (!user?.id) throw new Error("User Not Found");

      const result = await this.userService.getUserProfile({ id: user.id });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "User profile retrieved successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async updateUserProfile(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      const user: { id: string | null } = userData
        ? JSON.parse(userData)
        : null;

      if (!user?.id) throw new Error("User Not Found");

      const body = await request.json();
      const { success, error, data } =
        UserValidation.UpdateUserProfile().safeParse(body);

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

      const result = await this.userService.updateUserProfile({
        id: user.id,
        data,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          result,
          "User profile updated successfully"
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
