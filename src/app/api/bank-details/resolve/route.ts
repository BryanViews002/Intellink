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
    // Check if Korapay is configured
    if (!process.env.KORAPAY_SECRET_KEY) {
      console.error("KORAPAY_SECRET_KEY is not configured");
      return apiError("Payment service is not properly configured. Please contact support.", 500);
    }

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

    if (!bankCode) {
      return apiError("Please select a bank.");
    }

    try {
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
    } catch (korapayError) {
      console.error("Korapay resolve error:", korapayError);
      
      // Handle specific Korapay errors
      const errorMessage = korapayError instanceof Error ? korapayError.message : "Unknown error";
      
      if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
        return apiError("Payment service authentication failed. Please contact support.", 500);
      }
      
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        return apiError("Bank account not found. Please check the account number.");
      }
      
      if (errorMessage.includes("invalid") || errorMessage.includes("validation")) {
        return apiError("Invalid bank details. Please check and try again.");
      }
      
      return apiError("Unable to verify bank account. Please try again.", 500);
    }
  } catch (error) {
    console.error("Bank resolve error:", error);
    return apiError(
      error instanceof Error ? error.message : "Unable to verify bank account",
      500,
    );
  }
}
