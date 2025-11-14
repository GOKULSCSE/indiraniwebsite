import _ from "lodash";
import { IUser } from "../models/User";
import db from "../../lib/db";
import bcrypt from "bcrypt";
import { Password } from "@/utils/password";
import { mail } from "@/lib/mail";
import { ForgotPasswordTemplate } from "@/lib/mail/templates";
import jwt from "jsonwebtoken";
import { JwtUtils } from "@/utils/jwtUtils";
import { Role } from "@prisma/client";

const passowrdFun = new Password();

export class AuthService {
  Secret;

  constructor() {
    this.Secret = process.env.NEXTAUTH_SECRET;
  }

  async LoginWithPassword(userData: Pick<IUser, "email" | "password">) {
    let user;
    try {
      user = await db.user.findFirst({
        where: { email: userData.email, password: userData.password },
        include:{sellerProfile:true,role:true}
      });

      if (_.isEmpty(user))
        user = await db.regstrationRequest.findFirst({
          where: {
            email: userData.email,
            password: userData.password,
          },
        });
      return user || null;
    } catch (error) {
      console.log(error);
    }
    return user;
  }

  async ResetPassword({
    oldPassword,
    newPassword,
    id,
  }: {
    oldPassword: string;
    newPassword: string;
    id: string;
  }) {
    const userData = await db.user.findUnique({
      where: {
        id,
      },
    });

    if (_.isEmpty(userData)) throw new Error("Invalid Request");

    const isValidPassword = await passowrdFun.validatePassword({
      password: oldPassword,
      hashedPassword: userData.hasedPassword,
    });

    if (!isValidPassword) throw new Error("Invalid Credentials");

    const hasedPassword = await passowrdFun.genarateHashPassword(newPassword);

    const updateData = await db.user.update({
      where: { id },
      data: {
        password: newPassword,
        hasedPassword: hasedPassword,
      },
    });
    return updateData;
  }

  async ForgotPasswordRequest({
    email,
    baseUrl,
  }: {
    email: string;
    baseUrl: string;
  }) {
    const userData = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (_.isEmpty(userData)) throw new Error("Invalid Request");

    const requestData = await db.forgotPasswordRequest.upsert({
      where: { userId: userData.id },
      update: {},
      create: { userId: userData.id },
    });

    const token = jwt.sign({ id: requestData.id }, this.Secret!);

    await mail.sendMail({
      to: userData.email,
      subject: "Reset Password Mail",
      template: ForgotPasswordTemplate({
        link: `${baseUrl}/auth/forgot-password?token=${token}`,
      }),
    });
  }

  async ForgotPasswordTokenVerify({ token }: { token: string }) {
    const isValidToken = await JwtUtils.validateToken<{ id: string }>(token);

    if (!isValidToken) throw Error("Invalid Token");

    const isRequestExist = await db.forgotPasswordRequest.findFirst({
      where: { id: isValidToken.id },
    });

    if (!isRequestExist) throw Error("Invalid Request");

    return isRequestExist;
  }

  async ChangePassword({
    token,
    password,
  }: {
    token: string;
    password: string;
  }) {
    const isValidToken = await JwtUtils.validateToken<{ id: string }>(token);

    if (!isValidToken) throw Error("Invalid Token");

    const isRequestExist = await db.forgotPasswordRequest.findFirst({
      where: { id: isValidToken.id },
    });

    if (!isRequestExist) throw Error("Invalid Request");

    const hasedPassword = await passowrdFun.genarateHashPassword(password);

    await db.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id: isRequestExist.userId },
        data: {
          password,
          hasedPassword,
        },
        select: {
          id: true,
        },
      });

      await prisma.forgotPasswordRequest.delete({
        where: { id: isRequestExist.id },
      });
    });
-847
    return true;
  }

  async getRoleRoutes({ roleId }: { roleId: Role }) {
    let RoleRoutes=await db.roleRoutes.findMany({
      where: { roleId: roleId },
      include: { route: true },
    });


    let routesOnly=RoleRoutes?.map((route)=>{
      return route.route
    })

    return routesOnly
  }
}
