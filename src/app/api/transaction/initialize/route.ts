import { NextRequest } from "next/server";
import {
  apiError,
  apiResponse,
  hasVerifiedBankDetails,
  validateRequired,
} from "@/lib/auth";
import { initializeKorapayPayment, buildTransactionCheckout } from "@/lib/korapay";
import { supabaseAdmin } from "@/lib/supabase";
import { type OfferingType, type TransactionContext } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { valid, missing } = validateRequired(body, [
      "offering_id",
      "client_name",
      "client_email",
    ]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const offeringId = body.offering_id;
    const clientName = body.client_name.trim();
    const clientEmail = body.client_email.trim().toLowerCase();

    const { data: offering } = await supabaseAdmin
      .from("offerings")
      .select("id, user_id, type, title, price, is_active")
      .eq("id", offeringId)
      .eq("is_active", true)
      .single();

    if (!offering) {
      return apiError("Offering not found", 404);
    }

    const { data: expert } = await supabaseAdmin
      .from("users")
      .select(
        "id, name, email, subscription_status, bank_code, bank_account, account_name, korapay_recipient_verified",
      )
      .eq("id", offering.user_id)
      .single();

    if (!expert) {
      return apiError("Expert not found", 404);
    }

    if (expert.subscription_status !== "active") {
      return apiError("This expert is currently unavailable", 400);
    }

    if (!hasVerifiedBankDetails(expert)) {
      return apiError(
        "This expert has not completed payout setup yet.",
        400,
      );
    }

    const context: TransactionContext = {};

    if (offering.type === "qa") {
      if (!body.question_text?.trim()) {
        return apiError("Please include your question.");
      }

      context.questionText = body.question_text.trim();
    }

    if (offering.type === "session") {
      if (!body.preferred_time?.trim()) {
        return apiError("Please choose a preferred time.");
      }

      context.preferredTime = body.preferred_time;
    }

    const checkout = buildTransactionCheckout({
      amount: Number(offering.price),
      offeringId: offering.id,
      expertId: expert.id,
      offeringType: offering.type as OfferingType,
      customer: {
        name: clientName,
        email: clientEmail,
      },
      context,
    });

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert({
        client_email: clientEmail,
        client_name: clientName,
        expert_id: expert.id,
        offering_id: offering.id,
        offering_type: offering.type,
        amount_paid: offering.price,
        korapay_reference: checkout.reference,
        status: "pending",
        metadata: context,
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      return apiError("Unable to create transaction", 400);
    }

    try {
      const payment = await initializeKorapayPayment({
        amount: checkout.amount,
        reference: checkout.reference,
        customer: checkout.customer,
        redirectPath: checkout.redirectPath,
        metadata: checkout.metadata,
      });

      return apiResponse(
        {
          reference: checkout.reference,
          transaction_id: transaction.id,
          checkout_url:
            payment?.data?.checkout_url || payment?.data?.checkoutUrl || null,
        },
        "Payment initialized successfully",
      );
    } catch (error) {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transaction.id);

      throw error;
    }
  } catch (error) {
    console.error("Transaction initialize error:", error);
    return apiError(
      error instanceof Error ? error.message : "Internal server error",
      500,
    );
  }
}
