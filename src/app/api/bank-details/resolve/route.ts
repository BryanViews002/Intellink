import { NextRequest } from "next/server";
import {
  apiError,
  apiResponse,
  requireAuthenticatedUser,
  syncSubscriptionStatus,
  validateRequired,
} from "@/lib/auth";
import { resolveNigerianBankAccount } from "@/lib/korapay";

export const dynamic = "force-dynamic";

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

    return apiResponse(
      {
        account,
      },
      "Account verified successfully",
    );
  } catch (error) {
    console.error("Bank resolve error:", error);
    return apiError(
      error instanceof Error ? error.message : "Unable to verify bank account",
      500,
    );
  }
}
