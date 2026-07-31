import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (Next.js 16 middleware replacement).
 * 
 * - Protects /admin/* routes — requires auth cookie
 * - Protects /profile/* routes — requires auth cookie
 * - All game routes (/, /select, /prepare/*, /play/*, /result) are fully public
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route protection ──
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("lanify-auth-token")?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // ── Profile route protection ──
  if (pathname.startsWith("/profile")) {
    const token = request.cookies.get("lanify-auth-token")?.value;
    if (!token) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
