import { getToken } from "next-auth/jwt";
import { JwtUtils } from "../utils/jwtUtils";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

export interface UserPayload {
  roleId: Role;
  permissions: Array<{ path: string; isWildcard: boolean }>;
  [key:string]:any;
}

export async function authenticateUser(req: NextRequest): Promise<{ user: UserPayload | null; headers: Headers }> {

  const session = await getToken({ req, secret: process.env.NEXTAUTH_JWT_SECRET || process.env.NEXTAUTH_SECRET, raw: false });

  const authHeader = req.headers.get("Authorization") || req.cookies.get("Authorization")?.value
  
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!session && !headerToken) {
    return { user: null, headers: new Headers() };
  }

  let user: UserPayload | null = null;
  const requestHeaders = new Headers(req.headers);

  if (session) {
    user = session as UserPayload;
    requestHeaders.set("x-user", JSON.stringify(session));
  } else if (headerToken) {
    user = await JwtUtils.validateToken<UserPayload>(headerToken);
    requestHeaders.set("x-auth-token", headerToken);
    requestHeaders.set("x-user", JSON.stringify(user));
  }

  console.log("user",user)

  return { user, headers: requestHeaders };
}
