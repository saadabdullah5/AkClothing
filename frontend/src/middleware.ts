import { NextResponse, type NextRequest } from "next/server";
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  if (host === "www.akclothings.shop" || (host === "akclothings.shop" && request.headers.get("x-forwarded-proto") === "http")) {
    const url = request.nextUrl.clone(); url.protocol = "https:"; url.hostname = "akclothings.shop"; url.port = "";
    return NextResponse.redirect(url, 308);
  }
  const response = NextResponse.next();
  if (/^\/(cart|checkout|wishlist|account|admin|track|forgot-password|reset-password|order-confirmation)(\/|$)/.test(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
