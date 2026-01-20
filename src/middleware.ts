import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ["/dashboard", "/reports", "/settings"];

// Auth routes (redirect to dashboard if already logged in)
const authRoutes = ["/auth/signin", "/auth/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Redirect to signin if accessing protected route while not logged in
  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
