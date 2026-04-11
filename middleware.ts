import { NextRequest, NextResponse } from "next/server";
import { hasVerifiedBankDetails, syncSubscriptionStatus } from "@/lib/auth";
import { createMiddlewareSupabaseClient } from "@/lib/supabase";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  console.log("Middleware called for pathname:", pathname);

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const profile = await syncSubscriptionStatus(user.id);

  if (!profile) {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  if (profile.subscription_status !== "active") {
    return NextResponse.redirect(new URL("/pricing", request.url));
  }

  const isBankDetailsRoute = pathname === "/dashboard/bank-details";

  if (!hasVerifiedBankDetails(profile) && !isBankDetailsRoute) {
    return NextResponse.redirect(new URL("/dashboard/bank-details", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
