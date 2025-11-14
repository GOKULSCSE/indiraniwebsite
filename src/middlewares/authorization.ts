import { UserPayload } from "./auth";
import { NextRequest, NextResponse } from "next/server";


export function authorizeUser(user: UserPayload | null, req: NextRequest, requestHeaders: Headers): NextResponse {
  if (!user) {
    return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
  }

  if (user.roleId === "SUPERADMIN") {
    return NextResponse.next();
  }

  if (!user.permissions || user.permissions.length === 0) {
    return NextResponse.json({ error: "Forbidden - No permissions found" }, { status: 403 });
  }

  const pathname = req.nextUrl.pathname;
  const allowedPaths = user.permissions.map(p => p.path);
  const wildcardPaths = user.permissions.filter(p => p.isWildcard).map(p => p.path.replace(":path*", ""));

  if (allowedPaths.includes(pathname) || wildcardPaths.some(wildPath => pathname.startsWith(wildPath))) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.json({ error: "Forbidden - No access" }, { status: 403 });
}
