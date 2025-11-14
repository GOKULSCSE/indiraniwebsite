import { NextResponse } from "next/server";
import { IUser } from "../models/User";
import { ResponseGenerator } from "@/utils/responseGenerator";
import { UserService } from "../services/UserService";
import { AuthService } from "../services/AuthService";
import { Role } from "@prisma/client";

export class AuthController {
  private authService: AuthService;
  private Secret;

  constructor() {
    this.authService = new AuthService();
    this.Secret = process.env.NEXTAUTH_SECRET;
  }

  async LoginWithPassword(credential: Pick<IUser, "email" | "password">)  {
    return await this.authService.LoginWithPassword({ ...credential });
  }

  async ResetPassword(request: Request) {
    try {
      const body = await request.json();
      const result = await this.authService.ResetPassword({
        newPassword: body.newPassword,
        oldPassword: body.oldPassword,
        id: body.id,
      });
      if (!result) throw new Error("Somthing Went Wrong");

      return NextResponse.json(
        ResponseGenerator.generate(
          200,
          null,
          "Password has been changed Successfully"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async ForgotPasswordRequest(request: Request) {
    try {
      // const baseUrl = request.headers.get("origin") || "http://localhost:3000";
     const baseUrl = process.env.NEXTAUTH_URL!

      const body = await request.json();

      const result = await this.authService.ForgotPasswordRequest({
        email: body.email,
        baseUrl,
      });

      return NextResponse.json(
        ResponseGenerator.generate(
          200,
          null,
          "Reset Password Request Successfull, check your mail"
        )
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async ForgotPasswordTokenVerify(request: Request) {
    try {
      const body = await request.json();

      await this.authService.ForgotPasswordTokenVerify({
        token: body.token,
      });

      return NextResponse.json(
        ...ResponseGenerator.generate(
          200,
          { isValidToken: true },
          "Valid Token"
        )
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async ChangePassword(request: Request) {
    try {
      const body = await request.json();

      await this.authService.ChangePassword({
        token: body.token,
        password: body.password,
      });

      return NextResponse.json(
        ResponseGenerator.generate(201, null, "Password has been Changed")
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getRoleRoutes({ roleId }: { roleId: Role }) {
    try {
      const permissions=await this.authService.getRoleRoutes({
        roleId,
      });

     return permissions
    } catch (error) {
      console.log(error)
      return null
    }
  }

  private handleError(error: unknown): NextResponse {
    console.error(error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      ...ResponseGenerator.generate(500, null, errorMessage)
    );
  }
}
