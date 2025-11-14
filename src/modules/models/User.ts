import { Role } from "@prisma/client";
import { ISeller } from "./Seller";

export interface IUser {
  id?: string;
  name: string;
  email: string;
  profile?: string | null;
  emailVerifiedAt?: Date | null;
  isEmailVerified?: Boolean | null;
  password: string;
  roleId: Role;
  sellerProfile?: ISeller;
  [key:string]:any;
}

export class User implements IUser {
  id?: string | undefined;
  name: string;
  email: string;
  profile?: string | null;
  emailVerifiedAt?: Date | undefined | null;
  isEmailVerified?: Boolean | undefined | null;
  password: string;
  roleId: Role;
  sellerProfile?: ISeller;
  [key:string]:any;

  constructor(data: IUser) {
    const {
      id,
      name,
      email,
      emailVerifiedAt,
      isEmailVerified,
      password,
      roleId,
      profile,
    } = data;
    this.id = id;
    this.name = name;
    this.email = email;
    this.emailVerifiedAt = emailVerifiedAt;
    this.isEmailVerified = isEmailVerified;
    this.password = password;
    this.roleId = roleId;
    this.profile = profile ?? null;
  }
}
