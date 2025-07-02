import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    if (!req.nextauth.token) {
      const signinUrl = new URL("/signin", req.url);
      signinUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(signinUrl);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/capture", "/search"],
};