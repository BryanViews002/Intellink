import { NextRequest } from "next/server";
import { apiError, apiResponse, normalizeUsername, validateRequired } from "@/lib/auth";
import { supabaseAdmin, supabaseAuthServer } from "@/lib/supabase";
import type { SubscriptionStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { valid, missing } = validateRequired(body, [
      "name",
      "email",
      "username",
      "password",
    ]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();
    const username = normalizeUsername(body.username);
    const password = body.password;
    const promoCode = body.promo_code?.trim().toUpperCase() || '';

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters long");
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return apiError(
        "Username can only include lowercase letters, numbers, and underscores.",
      );
    }

    const [{ data: existingUsername }, { data: existingEmail }] = await Promise.all([
      supabaseAdmin.from("users").select("id").eq("username", username).maybeSingle(),
      supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle(),
    ]);

    if (existingUsername) {
      return apiError("That username is already taken.", 409);
    }

    if (existingEmail) {
      return apiError("That email is already registered.", 409);
    }

    const { data: createdUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          username,
        },
      });

    if (createError || !createdUser.user) {
      return apiError(createError?.message || "Unable to create account", 400);
    }

    const userId = createdUser.user.id;

    // Base profile data
    const baseProfileData = {
      id: userId,
      name,
      email,
      username,
      subscription_plan: null as any,
      subscription_status: "inactive" as SubscriptionStatus,
      subscription_expires_at: null as any,
      is_free_month: false,
      free_expires_at: null as any,
    };

    let profileData = baseProfileData;

    // Handle promo code
    if (promoCode === "BRYAN") {
      const { data: redeemResult, error: redeemError } = await supabaseAdmin.rpc("redeem_promo", {
        user_uuid: userId,
        promo: "BRYAN",
      });

      if (!redeemError && redeemResult?.[0]?.success) {
        const freeExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        profileData = {
          ...baseProfileData,
          is_free_month: true,
          free_expires_at: freeExpiresAt,
          subscription_plan: "pro" as const,
          subscription_status: "active" as SubscriptionStatus,
          subscription_expires_at: freeExpiresAt,
        };
      } else {
        console.error("Promo redeem failed during register:", redeemError || redeemResult?.[0]?.message);
      }
    }

    const { error: profileError } = await supabaseAdmin.from("users").insert(profileData);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return apiError("Unable to create user profile", 400);
    }

    const { data: signInData, error: signInError } =
      await supabaseAuthServer.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError || !signInData.session) {
      return apiError("Account created, but automatic sign-in failed.", 500);
    }

    const isFreeMonth = profileData.is_free_month;
    const responseMessage = isFreeMonth
      ? "Account created with BRYAN promo! Pro plan free for 30 days."
      : "Account created successfully. Choose a plan to continue.";

    return apiResponse(
      {
        user_id: userId,
        email,
        subscription_status: profileData.subscription_status,
        is_free_month: isFreeMonth,
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      responseMessage,
      201,
    );
  } catch (error) {
    console.error("Register error:", error);
    return apiError("Internal server error", 500);
  }
}

