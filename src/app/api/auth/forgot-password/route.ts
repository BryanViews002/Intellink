import { NextRequest } from "next/server";
import { apiError, apiResponse, normalizeUsername, validateRequired } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { valid, missing } = validateRequired(body, ["email"]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const identifier = body.email.trim().toLowerCase();
    let email = identifier;

    // Support username lookup
    if (!identifier.includes("@")) {
      const username = normalizeUsername(identifier);
      const { data: profileByUsername } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("username", username)
        .maybeSingle();

      if (!profileByUsername?.email) {
        // Don't reveal whether the account exists
        return apiResponse(
          null,
          "If an account exists with that email or username, a password reset link has been sent.",
        );
      }

      email = String(profileByUsername.email).trim().toLowerCase();
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
    }

    // Always return success to prevent email enumeration
    return apiResponse(
      null,
      "If an account exists with that email or username, a password reset link has been sent.",
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiError("Internal server error", 500);
  }
}
