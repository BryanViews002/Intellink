import { NextRequest, NextResponse } from "next/server";
import { type User as AuthUser } from "@supabase/supabase-js";
import { createRouteHandlerSupabaseClient, supabaseAdmin } from "@/lib/supabase";
import { sendSubscriptionExpiredEmail } from "@/lib/email";

type JsonResponseData = Record<string, unknown> | null;

export function apiResponse(
  data: JsonResponseData = null,
  message = "Success",
  statusCode = 200,
) {
  return NextResponse.json(
    {
      success: statusCode < 400,
      message,
      data,
    },
    { status: statusCode },
  );
}

export function apiError(message: string, statusCode = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: statusCode },
  );
}

export function validateRequired(
  body: Record<string, unknown>,
  requiredFields: string[],
) {
  const missing = requiredFields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === "";
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

export async function getAuthenticatedUser(request?: NextRequest) {
  const bearerToken =
    request?.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  if (bearerToken) {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(bearerToken);

    return {
      user,
      error: error?.message ?? null,
    };
  }

  const supabase = createRouteHandlerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    user,
    error: error?.message ?? null,
  };
}

export async function requireAuthenticatedUser(request?: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);

  if (!user || error) {
    return {
      user: null,
      error: apiError("Unauthorized", 401),
    };
  }

  return {
    user,
    error: null,
  };
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function syncSubscriptionStatus(userId: string) {
  const { data: userProfile, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !userProfile) {
    return null;
  }

  const expiresAt = userProfile.subscription_expires_at
    ? new Date(userProfile.subscription_expires_at)
    : null;

  const isExpired = !expiresAt || expiresAt.getTime() <= Date.now();

  if (!isExpired) {
    return userProfile;
  }

  if (userProfile.subscription_status !== "inactive") {
    await supabaseAdmin
      .from("users")
      .update({
        subscription_status: "inactive",
      })
      .eq("id", userId);

    try {
      await sendSubscriptionExpiredEmail(userProfile.email, userProfile.name);
    } catch (error) {
      console.error("Failed to send subscription expired email:", error);
    }
  }

  return {
    ...userProfile,
    subscription_status: "inactive",
  };
}

export async function requireAdminUser(user: AuthUser) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const email = user.email?.trim().toLowerCase();

  if (!adminEmail || !email || email !== adminEmail) {
    return false;
  }

  return true;
}

export function hasVerifiedBankDetails(profile: {
  korapay_recipient_verified?: boolean | null;
  bank_code?: string | null;
  bank_account?: string | null;
  account_name?: string | null;
}) {
  return Boolean(
    profile.korapay_recipient_verified &&
      profile.bank_code &&
      profile.bank_account &&
      profile.account_name,
  );
}

export function isExpertTrusted(profile: {
  trust_status?: string | null;
}) {
  return (profile.trust_status ?? "good") === "good";
}

export function canExpertAcceptPurchases(
  profile: {
    subscription_status?: string | null;
    korapay_recipient_verified?: boolean | null;
    bank_code?: string | null;
    bank_account?: string | null;
    account_name?: string | null;
    trust_status?: string | null;
  },
) {
  return (
    profile.subscription_status === "active" &&
    hasVerifiedBankDetails(profile) &&
    isExpertTrusted(profile)
  );
}
