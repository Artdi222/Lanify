import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (Next.js 16 middleware replacement).
 * 
 * - Protects /admin/* routes (except /admin/login) — requires admin cookie
 * - Protects /profile/* routes — requires auth cookie
 * - All game routes (/, /select, /prepare/*, /play/*, /result) are fully public
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route protection ──
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("lanify-admin-token")?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // ── Profile route protection ──
  if (pathname.startsWith("/profile")) {
    const token = request.cookies.get("lanify-auth")?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
