import { AuthController } from "@/modules/controllers/AuthController";
import { UserController } from "@/modules/controllers/UserController";
import { JwtUtils } from "@/utils/jwtUtils";
import { ResponseGenerator } from "@/utils/responseGenerator";
import _ from "lodash";
import { NextResponse } from "next/server";
import { ISeller } from "@/modules/models/Seller";
import { Role } from "@prisma/client";

interface UserWithSeller {
  email: string;
  password: string;
  name: string;
  id: string;
  roleId: Role;
  isEmailVerified: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  sellerProfile?: ISeller;
}

const authController = new AuthController();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body?.email || !body?.password) {
      return NextResponse.json(
        ...ResponseGenerator.generate(400, null, "Email and password are required")
      );
    }

    
    const dbUser = (await authController.LoginWithPassword({
      email: body?.email,
      password: body?.password,
    })) as UserWithSeller;

    if (!dbUser) throw new Error("Invalid Credential");

    if (dbUser?.isEmailVerified == false) {
      throw new Error("Please verify your email");
    }

    const permissions = await authController.getRoleRoutes({
      roleId: dbUser.roleId,
    });

    const accessToken = await JwtUtils.generateToken({
      email: dbUser.email,
      id: dbUser.id,
      roleId: dbUser.roleId,
      isSeller: dbUser.sellerProfile?.isApproved ?? false,
      sellerId: dbUser.sellerProfile?.id ?? null,
      permissions,
    });

    const response = NextResponse.json(
      ...ResponseGenerator.generate(200, accessToken, "Login Successed")
    );

    response.cookies.set({
      name: "Authorization",
      value: `Bearer ${accessToken}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      path: "/",
    });

    return response;
  } catch (error) {
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
