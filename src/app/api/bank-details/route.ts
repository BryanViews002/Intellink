import { NextRequest } from "next/server";
import {
  apiError,
  apiResponse,
  requireAuthenticatedUser,
  syncSubscriptionStatus,
  validateRequired,
} from "@/lib/auth";
import { resolveNigerianBankAccount } from "@/lib/korapay";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function mapBankDetailsError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unable to save bank details";
  const normalized = message.toLowerCase();

  if (normalized.includes("korapay_secret_key")) {
    return apiError(
      "Bank verification is temporarily unavailable. Please try again shortly.",
      503,
    );
  }

  if (
    normalized.includes("unable to verify bank account") ||
    normalized.includes("invalid") ||
    normalized.includes("account") ||
    normalized.includes("bank")
  ) {
    return apiError(message, 400);
  }

  return apiError("Unable to save bank details right now.", 502);
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthenticatedUser(request);

    if (error || !user) {
      return error ?? apiError("Unauthorized", 401);
    }

    const profile = await syncSubscriptionStatus(user.id);

    if (!profile || profile.subscription_status !== "active") {
      return apiError("An active subscription is required.", 403);
    }

    const body = (await request.json()) as Record<string, string>;
    const { valid, missing } = validateRequired(body, [
      "bank_code",
      "bank_account",
    ]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const bankCode = body.bank_code.trim();
    const bankAccount = body.bank_account.replace(/\D/g, "");

    if (bankAccount.length !== 10) {
      return apiError("Account number must be 10 digits.");
    }

    const account = await resolveNigerianBankAccount({
      bankCode,
      accountNumber: bankAccount,
    });

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        bank_code: account.bank_code,
        bank_account: account.account_number,
        account_name: account.account_name,
        korapay_recipient_verified: true,
      })
      .eq("id", user.id);

    if (updateError) {
      return apiError("Unable to save bank details.", 400);
    }

    return apiResponse(
      {
        account,
      },
      "Bank details saved successfully",
    );
  } catch (error) {
    console.error("Bank details save error:", error);
    return mapBankDetailsError(error);
  }
}
