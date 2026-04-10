import { NextRequest } from "next/server";
import { apiError, apiResponse, requireAuthenticatedUser, validateRequired } from "@/lib/auth";
import { buildSubscriptionCheckout, createSubscriptionExpiry, initializeKorapayPayment } from "@/lib/korapay";
import { supabaseAdmin } from "@/lib/supabase";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { type SubscriptionPlan } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthenticatedUser(request);

    if (error || !user) {
      return error ?? apiError("Unauthorized", 401);
    }

    const body = (await request.json()) as Record<string, string>;
    const { valid, missing } = validateRequired(body, ["plan"]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const plan = body.plan as SubscriptionPlan;

    if (!Object.keys(SUBSCRIPTION_PLANS).includes(plan)) {
      return apiError("Invalid subscription plan");
    }

    // Check free month first
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, name, email, is_free_month, free_expires_at, subscription_status")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return apiError("User profile not found", 404);
    }

    const now = new Date();
    const freeExpires = profile.free_expires_at ? new Date(profile.free_expires_at) : null;

    // If free month active, bypass payment and extend if needed
    if (profile.is_free_month && freeExpires && freeExpires > now && profile.subscription_status === "active") {
      const newExpires = createSubscriptionExpiry(plan);
      if (newExpires > freeExpires) {
        await supabaseAdmin
          .from("users")
          .update({ 
            subscription_expires_at: newExpires.toISOString(),
            subscription_plan: plan 
          })
          .eq("id", user.id);
      }

      return apiResponse({
        success: true,
        message: "Subscription renewed using free month balance. No payment needed.",
        checkout_url: null,
        plan,
        is_free_month: true,
        free_until: profile.free_expires_at,
      });
    }

    // Normal paid subscription flow
    const checkout = buildSubscriptionCheckout(plan, profile);
    const expiresAt = createSubscriptionExpiry(plan);

    const payment = await initializeKorapayPayment({
      amount: checkout.amount,
      reference: checkout.reference,
      customer: checkout.customer,
      redirectPath: checkout.redirectPath,
      metadata: checkout.metadata,
    });

    const { error: insertError } = await supabaseAdmin.from("subscriptions").insert({
      user_id: user.id,
      plan,
      amount: checkout.amount,
      korapay_reference: checkout.reference,
      status: "pending",
      started_at: null,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      return apiError("Unable to save subscription checkout", 400);
    }

    return apiResponse(
      {
        reference: checkout.reference,
        checkout_url:
          payment?.data?.checkout_url || payment?.data?.checkoutUrl || null,
        amount: checkout.amount,
        plan,
      },
      "Subscription checkout initialized successfully",
    );
  } catch (error) {
    console.error("Subscription initialize error:", error);
    return apiError(
      error instanceof Error ? error.message : "Internal server error",
      500,
    );
  }
}

