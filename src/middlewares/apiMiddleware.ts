import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "./auth";
import { authorizeUser } from "./authorization";

export async function apiMiddleware(req: NextRequest) {
  console.log("middleware called")
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const { user, headers } = await authenticateUser(req);
  console.log("user",user)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized - Not authenticated" }, { status: 401 });
  }

  return authorizeUser(user, req, headers);
}
