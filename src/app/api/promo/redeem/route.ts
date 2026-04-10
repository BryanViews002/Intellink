import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { apiError, apiResponse, requireAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthenticatedUser(request);

    if (error || !user) {
      return error ?? apiError("Unauthorized", 401);
    }

    // Expect body: { promo_code: "BRYAN" }
    const body = await request.json();
    const promoCode = body.promo_code?.trim().toUpperCase();

    if (!promoCode || promoCode !== "BRYAN") {
      return apiError("Invalid promo code");
    }

    // Call atomic redeem function
    const { data, error: dbError } = await supabaseAdmin.rpc("redeem_promo", {
      user_uuid: user.id,
      promo: promoCode,
    });

    if (dbError) {
      console.error("Promo redeem DB error:", dbError);
      return apiError(dbError.message || "Unable to redeem promo");
    }

    const result = data?.[0];
    
    if (!result || !result.success) {
      return apiError(result?.message || "Promo redemption failed");
    }

    // Success: Set free month on user profile
    const freeExpiresAt = new Date();
    freeExpiresAt.setDate(freeExpiresAt.getDate() + 30);

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        is_free_month: true,
        free_expires_at: freeExpiresAt.toISOString(),
        subscription_plan: "pro",
        subscription_status: "active",
        subscription_expires_at: freeExpiresAt.toISOString(),
      })
      .eq("id", user.id)
      .single();

    if (updateError) {
      // Rollback redemption if update fails (best effort)
      await supabaseAdmin.rpc("rollback_promo_redeem", { /* TBD */ });
      return apiError("Promo applied but profile update failed");
    }

    return apiResponse(
      { 
        success: true, 
        message: "🎉 Promo BRYAN applied! First month free (Pro plan).",
        free_until: freeExpiresAt.toISOString()
      },
      "Promo redeemed successfully"
    );
  } catch (error) {
    console.error("Promo redeem error:", error);
    return apiError("Internal server error", 500);
  }
}

