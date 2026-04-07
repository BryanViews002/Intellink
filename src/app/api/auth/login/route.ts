import { NextRequest } from "next/server";
import { apiError, apiResponse, syncSubscriptionStatus, validateRequired } from "@/lib/auth";
import { supabaseAuthServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { valid, missing } = validateRequired(body, ["email", "password"]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    const { data, error } = await supabaseAuthServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return apiError("Invalid email or password", 401);
    }

    const profile = await syncSubscriptionStatus(data.user.id);

    if (!profile) {
      return apiError("User profile not found", 404);
    }

    return apiResponse(
      {
        user_id: data.user.id,
        email,
        subscription_status: profile.subscription_status,
        subscription_plan: profile.subscription_plan,
        subscription_expires_at: profile.subscription_expires_at,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      "Login successful",
    );
  } catch (error) {
    console.error("Login error:", error);
    return apiError("Internal server error", 500);
  }
}
