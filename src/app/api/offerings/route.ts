import { NextRequest } from "next/server";
import {
  apiError,
  apiResponse,
  hasVerifiedBankDetails,
  isExpertTrusted,
  requireAuthenticatedUser,
  syncSubscriptionStatus,
  validateRequired,
} from "@/lib/auth";
import { OFFERING_TYPE_OPTIONS } from "@/lib/constants";
import { supabaseAdmin } from "@/lib/supabase";
import { type OfferingType } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthenticatedUser(request);

    if (error || !user) {
      return error ?? apiError("Unauthorized", 401);
    }

    const { data: offerings, error: offeringsError } = await supabaseAdmin
      .from("offerings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (offeringsError) {
      return apiError("Unable to load offerings", 400);
    }

    return apiResponse(
      {
        offerings: offerings ?? [],
      },
      "Offerings loaded successfully",
    );
  } catch (error) {
    console.error("Offerings GET error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthenticatedUser(request);

    if (error || !user) {
      return error ?? apiError("Unauthorized", 401);
    }

    const profile = await syncSubscriptionStatus(user.id);

    if (!profile || profile.subscription_status !== "active") {
      return apiError("An active subscription is required to create offerings.", 403);
    }

    if (!hasVerifiedBankDetails(profile)) {
      return apiError(
        "Verify your bank details before publishing offerings.",
        403,
      );
    }

    if (!isExpertTrusted(profile)) {
      return apiError(
        "Your expert account is currently restricted from publishing new offerings.",
        403,
      );
    }

    const body = (await request.json()) as Record<string, string | boolean>;
    const { valid, missing } = validateRequired(body, [
      "type",
      "title",
      "description",
      "price",
    ]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const offeringType = body.type as OfferingType;

    if (!Object.keys(OFFERING_TYPE_OPTIONS).includes(offeringType)) {
      return apiError("Invalid offering type");
    }

    const { data: existingOfferings } = await supabaseAdmin
      .from("offerings")
      .select("id, type")
      .eq("user_id", user.id);

    if (profile.subscription_plan === "starter") {
      const existingTypes = new Set((existingOfferings ?? []).map((item) => item.type));

      if (existingTypes.size > 0 && !existingTypes.has(offeringType)) {
        return apiError(
          "Starter plan allows only one offering type. Upgrade to Pro to unlock all three.",
          403,
        );
      }
    }

    const { data: offering, error: insertError } = await supabaseAdmin
      .from("offerings")
      .insert({
        user_id: user.id,
        type: offeringType,
        title: String(body.title).trim(),
        description: String(body.description).trim(),
        price: Number(body.price),
        file_url: body.file_url ? String(body.file_url) : null,
        is_active: body.is_active === false ? false : true,
      })
      .select("*")
      .single();

    if (insertError || !offering) {
      return apiError("Unable to create offering", 400);
    }

    return apiResponse(
      {
        offering,
      },
      "Offering created successfully",
      201,
    );
  } catch (error) {
    console.error("Offerings POST error:", error);
    return apiError("Internal server error", 500);
  }
}
