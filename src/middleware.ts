import { NextRequest,NextResponse  } from "next/server";
import { apiMiddleware } from "./middlewares";

export const config = {
  matcher: [
    "/api/seller/:path*",
    "/api/user/shippingAddress",
    "/api/user/orders",
    "/api/user/orders/:path*",
    "/api/user/:path*",
    "/api/shiprocket/:path*"
  ],
};

export async function middleware(req: NextRequest) {
  return apiMiddleware(req);
  // return NextResponse.next();
}
