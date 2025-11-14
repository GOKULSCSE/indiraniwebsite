import _ from "lodash";
import { IUser, User } from "../models/User";
import db from "../../lib/db";
import jwt from "jsonwebtoken";
import { mail } from "@/lib/mail";
import { AccountVerificationTemplate } from "@/lib/mail/templates";
import bcrypt from "bcrypt";
import { Password } from "@/utils/password";
import { Role } from "@prisma/client";

const passowrdFun = new Password();

export class UserService {
  Secret;

  constructor() {
    this.Secret = process.env.NEXTAUTH_SECRET;
  }

  async registerUser({
    userData,
    baseUrl,
  }: {
    userData: IUser;
    baseUrl: string;
  }): Promise<IUser | null> {
    try {
      const user = new User(userData);

      const existingUser = await db.user.findFirst({
        where: { email: user.email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const requestData = await db.regstrationRequest.create({
        data: {
          email: user.email,
          name: user.name,
          password: user.password,
          roleId: Role.USER,
        },
      });

      const token = jwt.sign({ id: requestData?.id }, this.Secret!);

      await mail.sendMail({
        to: user.email,
        subject: "Account Verification Mail",
        template: AccountVerificationTemplate({
          link: `${baseUrl}/api/auth/verification?token=${token}`,
        }),
      });
      return requestData;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async LoginWithPassword(userData: Pick<IUser, "email" | "password">) {
    let user;
    try {
      user = await db.user.findFirst({
        where: { email: userData.email, password: userData.password },
      });

      if (_.isEmpty(user))
        user = db.regstrationRequest.findFirst({
          where: {
            email: userData.email,
            password: userData.password,
          },
        });

      console.log("Payload : ", userData);
      console.log("User from db : ", user);
      // return user || null;
    } catch (error) {
      console.log(error);
    }
    return user;
  }

  async verifyUserAccount(registrationRequestId: string): Promise<string> {
    try {
      const registrationRequest = await db.regstrationRequest.findUnique({
        where: { id: registrationRequestId },
      });

      if (!registrationRequest) {
        throw new Error("Invalid verification token");
      }

      const existingUser = await db.user.findUnique({
        where: { email: registrationRequest.email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const hasedPassword = await passowrdFun.genarateHashPassword(
        registrationRequest.password
      );

      const user = await db.user.create({
        data: {
          email: registrationRequest.email,
          name: registrationRequest.name,
          password: registrationRequest.password,
          hasedPassword,
          roleId: registrationRequest.roleId,
          isEmailVerified: true,
        },
      });

      await db.regstrationRequest.delete({
        where: { id: registrationRequestId },
      });

      return "Account verified successfully";
    } catch (error) {
      throw error;
    }
  }

  async getVerificationToken({ email }: Pick<IUser, "email">) {
    try {
      const existingUser = await db.user.findFirst({
        where: { email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const requestData = await db.regstrationRequest.findFirst({
        where: {
          email,
        },
      });

      if (_.isEmpty(requestData)) return null;

      const token = jwt.sign({ id: requestData?.id }, this.Secret!);

      return token;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createUserAccount(userData: IUser): Promise<IUser> {
    try {
      const user = new User(userData);

      const existingUser = await db.user.findFirst({
        where: { email: user.email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }
      const hasedPassword = await passowrdFun.genarateHashPassword(
        userData.password
      );

      const requestData = await db.user.create({
        data: {
          email: user.email,
          name: user.name,
          profile: userData.profile,
          password: String(userData.password),
          hasedPassword: hasedPassword,
          roleId: Role.USER,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
        include: {
          role: true,
          sellerProfile: true,
        },
      });

      return {
        ...requestData,
        sellerProfile: requestData.sellerProfile || undefined,
      } as IUser;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getUserAccount(
    userData: Pick<IUser, "email" | "id">
  ): Promise<IUser | null> {
    const user = await db.user.findUnique({
      where: {
        email: userData.email,
        ...(userData.id && { id: userData.id }),
      },
      include: {
        sellerProfile: true,
        role: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      sellerProfile: user.sellerProfile || undefined,
    } as IUser;
  }

  async getUserProfile({ id }: { id: string }) {
    try {
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true, 
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          profile: true,
          isEmailVerified: true,
          emailVerifiedAt: true,
          addresses: true,
          companyName: true,
          gstid: true
        },
      });

      if (!user) throw new Error("User not found");

      return user;
    } catch (error: any) {
      throw {
        message: error.message || "Failed to get user profile",
        status: 500,
      };
    }
  }

  async updateUserProfile({
    id,
    data,
  }: {
    id: string;
    data: {
      firstName?: string;
      lastName?: string;
      name?: string;
      profile?: string;
      companyName?: string;
      gstid?: string;
    };
  }) {
    try {
      const user = await db.user.update({
        where: { id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          name: data.name,
          profile: data.profile,
          companyName: data.companyName,
          gstid: data.gstid
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          profile: true,
          isEmailVerified: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          addresses: true,
          companyName: true,
          gstid: true,
          sellerProfile: {
            include: {
              bankAccount: true,
            },
          },
        },
      });

      if (!user) throw new Error("User not found");

      return user;
    } catch (error: any) {
      throw {
        message: error.message || "Failed to update user profile",
        status: 500,
      };
    }
  }
}
