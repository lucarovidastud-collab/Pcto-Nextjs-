import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { LOCALE_COOKIE_NAME, localizedPath, stripLocaleFromPathname } from "./lib/i18n/path";
import { locales } from "./i18n/routing";

const SESSION_COOKIE = "quotegen_session";
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "super-secret-admin-fallback-key-2026";
const encodedKey = new TextEncoder().encode(ADMIN_SECRET_KEY);
const intlMiddleware = createIntlMiddleware(routing);

function applySecurityHeaders(response: NextResponse, isApi: boolean) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://apis.google.com https://www.gstatic.com https://accounts.google.com https://js.stripe.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss: https://api.stripe.com https://r.stripe.com",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.google.com https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://*.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  );
  if (isApi) {
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const rawPath = request.nextUrl.pathname;

  // API routes and public proposal pages must NOT go through the i18n middleware:
  // it would rewrite/redirect them and break JSON fetches (HTML instead of JSON → 404).
  if (rawPath.startsWith("/api/")) {
    return applySecurityHeaders(NextResponse.next(), true);
  }
  if (rawPath === "/p" || rawPath.startsWith("/p/")) {
    return applySecurityHeaders(NextResponse.next(), false);
  }

  // Link cliente con prefisso lingua (es. /en/p/token) → URL canonica /p/token + cookie
  const prefixedProposal = rawPath.match(
    new RegExp(`^/(${locales.join("|")})/p(?:/(.*))?$`)
  );
  if (prefixedProposal) {
    const [, loc, tokenPath] = prefixedProposal;
    const target = tokenPath ? `/p/${tokenPath}` : "/p";
    const response = NextResponse.redirect(new URL(target, request.url));
    response.cookies.set(LOCALE_COOKIE_NAME, loc, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
    return applySecurityHeaders(response, false);
  }

  const { locale, pathname } = stripLocaleFromPathname(rawPath);
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/dashboard") && !hasSession) {
    return NextResponse.redirect(new URL(localizedPath("/login", locale), request.url));
  }
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL(localizedPath("/dashboard", locale), request.url));
  }

  // Admin route protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL(localizedPath("/admin/login", locale), request.url));
    }
    try {
      const { payload } = await jwtVerify(adminToken, encodedKey, { algorithms: ["HS256"] });
      if (payload.role !== "superadmin") {
        return NextResponse.redirect(new URL(localizedPath("/admin/login", locale), request.url));
      }
    } catch {
      return NextResponse.redirect(new URL(localizedPath("/admin/login", locale), request.url));
    }
  }

  const response = intlMiddleware(request);
  return applySecurityHeaders(response, false);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
