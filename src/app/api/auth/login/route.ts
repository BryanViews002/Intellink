import { NextRequest } from "next/server";
import {
  apiError,
  apiResponse,
  normalizeUsername,
  syncSubscriptionStatus,
  validateRequired,
} from "@/lib/auth";
import { supabaseAdmin, supabaseAuthServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { valid, missing } = validateRequired(body, ["email", "password"]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const identifier = body.email.trim().toLowerCase();
    const password = body.password;
    let email = identifier;

    if (!identifier.includes("@")) {
      const username = normalizeUsername(identifier);
      const { data: profileByUsername } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("username", username)
        .maybeSingle();

      if (!profileByUsername?.email) {
        return apiError("No account found for that email or username.", 404);
      }

      email = String(profileByUsername.email).trim().toLowerCase();
    }

    const { data, error } = await supabaseAuthServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login rejected credentials:", {
        identifier,
        resolvedEmail: email,
        message: error.message,
        status: error.status,
      });
    }

    if (error || !data.user || !data.session) {
      const { data: profileByEmail } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (!profileByEmail) {
        return apiError(
          "No account found for that email or username in this app.",
          404,
        );
      }

      if (error?.message?.toLowerCase().includes("email not confirmed")) {
        return apiError("Your email is not confirmed yet.", 403);
      }

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
