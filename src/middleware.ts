import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

import { canAccessPath, isProtectedPath } from "@/lib/auth/authorization";
import { POST_LOGIN_REDIRECT, PUBLIC_ROUTES } from "@/lib/auth/constants";
import {
  getSessionOptions,
  isAuthenticatedSession,
  type AuthSessionData,
} from "@/lib/auth/session";

function isLoginPath(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = isProtectedPath(pathname);
  const isLogin = isLoginPath(pathname);

  if (!isProtected && !isLogin) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<Partial<AuthSessionData>>(
    request,
    response,
    getSessionOptions(),
  );
  const isAuthenticated = isAuthenticatedSession(session);

  if (isLogin) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(POST_LOGIN_REDIRECT, request.url));
    }

    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!canAccessPath(session.role, pathname)) {
    return NextResponse.redirect(new URL(POST_LOGIN_REDIRECT, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/lawyer/:path*",
    "/admin/:path*",
    "/login",
  ],
};
