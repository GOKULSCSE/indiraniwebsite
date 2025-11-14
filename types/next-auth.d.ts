import NextAuth from "next-auth";

export interface SessionUser {

    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roleId: string;
    isSeller: boolean;
    isSellerApproved:boolean;
    sellerId:string;

}

declare module "next-auth" {
  export interface Session {
    user: SessionUser
  }

  interface User {
    id: string;
  }
}
