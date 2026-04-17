import { NextRequest } from "next/server";
import { apiError, apiResponse, hasVerifiedBankDetails } from "@/lib/auth";
import {
  createSubscriptionExpiry,
  disburseFlutterwavePayout,
  verifyFlutterwaveSignature,
} from "@/lib/flutterwave";
import {
  sendPayoutReceivedEmail,
  sendSubscriptionWelcomeEmail,
} from "@/lib/email";
import { formatCurrency } from "@/lib/format";
import { processTransactionCharge } from "@/lib/transaction-processing";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Flutterwave sends the secret hash directly in the "verifi-hash" header
    const signature =
      request.headers.get("verifi-hash") ||
      request.headers.get("flutterwave-signature") ||
      "";

    console.log("FLW Webhook received - signature present:", !!signature);
    console.log("FLW Webhook raw body:", rawBody.substring(0, 500));

    if (!verifyFlutterwaveSignature(signature)) {
      console.error("FLW Webhook signature verification failed");
      return apiError("Invalid webhook signature", 401);
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      data?: {
        id?: number;
        tx_ref?: string;
        reference?: string;
        status?: string;
        amount?: number;
        currency?: string;
      };
    };

    console.log("FLW Webhook event:", payload.event);

    // ── TRANSFER (PAYOUT) EVENTS ───────────────────────────────────────────
    if (payload.event === "transfer.completed") {
      const payoutRef = payload.data?.reference;
      const transferStatus = (payload.data?.status ?? "").toUpperCase();
      console.log("Processing transfer.completed:", { payoutRef, transferStatus });
      return handlePayoutTransferEvent(transferStatus, payoutRef);
    }

    // ── FAILED CHARGE ──────────────────────────────────────────────────────
    if (payload.event === "charge.failed") {
      const ref = payload.data?.tx_ref;
      console.log("Processing charge.failed:", ref);
      return handleChargeFailed(ref);
    }

    // ── SUCCESSFUL CHARGE ──────────────────────────────────────────────────
    if (payload.event !== "charge.completed") {
      console.log("FLW Webhook event ignored:", payload.event);
      return apiResponse(null, "Event ignored");
    }

    const chargeStatus = (payload.data?.status ?? "").toLowerCase();
    const reference = payload.data?.tx_ref;

    console.log("FLW charge.completed:", { reference, chargeStatus });

    if (chargeStatus !== "successful") {
      console.log("FLW charge not successful, status:", chargeStatus);
      if (reference) await handleChargeFailed(reference);
      return apiResponse(null, "Charge not successful");
    }

    if (!reference) {
      console.error("FLW Webhook missing tx_ref");
      return apiError("Missing payment reference");
    }

    if (reference.startsWith("SUB_")) {
      console.log("Processing subscription charge:", reference);
      return handleSubscriptionCharge(reference);
    }

    if (reference.startsWith("INTLNK_")) {
      console.log("Processing transaction charge:", reference);
      return handleTransactionCharge(reference);
    }

    console.log("FLW Webhook reference type ignored:", reference);
    return apiResponse(null, "Reference type ignored");
  } catch (error) {
    console.error("FLW Webhook error:", error);
    return apiError("Internal server error", 500);
  }
}

async function handleSubscriptionCharge(reference: string) {
  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("korapay_reference", reference)
    .single();

  if (!subscription) {
    console.error("Subscription not found for reference:", reference);
    return apiError("Subscription not found", 404);
  }

  // Idempotency: skip if already active
  if (subscription.status === "active") {
    console.log("Subscription already active, skipping:", reference);
    return apiResponse({ reference, plan: subscription.plan }, "Subscription already active");
  }

  const expiresAt = createSubscriptionExpiry(subscription.plan);

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", subscription.id);

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, email")
    .eq("id", subscription.user_id)
    .single();

  if (!user) {
    return apiError("User not found", 404);
  }

  await supabaseAdmin
    .from("users")
    .update({
      subscription_status: "active",
      subscription_plan: subscription.plan,
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq("id", subscription.user_id);

  try {
    await sendSubscriptionWelcomeEmail(user.email, user.name, subscription.plan);
  } catch (error) {
    console.error("Welcome email failed:", error);
  }

  return apiResponse(
    { reference, plan: subscription.plan },
    "Subscription activated successfully",
  );
}

async function handleTransactionCharge(reference: string) {
  const result = await processTransactionCharge(reference);

  if (!result) {
    return apiError("Transaction context missing", 404);
  }

  // Initiate expert payout if not already processed
  if (!result.alreadyProcessed) {
    const { data: txRow } = await supabaseAdmin
      .from("transactions")
      .select("id, expert_id, client_name, amount_paid, offering_id")
      .eq("korapay_reference", reference)
      .single();

    if (txRow) {
      const { data: expert } = await supabaseAdmin
        .from("users")
        .select("id, name, email, bank_code, bank_account, account_name, korapay_recipient_verified")
        .eq("id", txRow.expert_id)
        .single();

      const { data: offering } = await supabaseAdmin
        .from("offerings")
        .select("title")
        .eq("id", txRow.offering_id)
        .single();

      if (expert) {
        await initiateExpertPayout({
          transactionId: txRow.id,
          expert,
          transaction: {
            id: txRow.id,
            client_name: txRow.client_name,
            amount_paid: txRow.amount_paid,
          },
          offeringTitle: offering?.title ?? "Expert offering",
        });
      }
    }
  }

  return apiResponse(
    { reference, transaction_id: result.transactionId },
    "Transaction processed successfully",
  );
}

async function handleChargeFailed(reference: string | undefined) {
  if (!reference) {
    return apiError("Missing payment reference for charge.failed", 400);
  }

  console.log("Handling charge.failed for reference:", reference);

  if (reference.startsWith("SUB_")) {
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "failed" })
      .eq("korapay_reference", reference)
      .neq("status", "active");

    if (error) {
      console.error("Failed to update subscription status on charge.failed:", error);
    }
    return apiResponse({ reference }, "Subscription charge failed");
  }

  if (reference.startsWith("INTLNK_")) {
    const { error } = await supabaseAdmin
      .from("transactions")
      .update({ status: "failed" })
      .eq("korapay_reference", reference)
      .neq("status", "success");

    if (error) {
      console.error("Failed to update transaction status on charge.failed:", error);
    }
    return apiResponse({ reference }, "Transaction charge failed");
  }

  return apiResponse({ reference }, "Charge failed - reference type ignored");
}

async function initiateExpertPayout(args: {
  transactionId: string;
  expert: {
    id: string;
    name: string;
    email: string;
    bank_code: string | null;
    bank_account: string | null;
    account_name: string | null;
    korapay_recipient_verified: boolean;
  };
  transaction: {
    id: string;
    client_name: string;
    amount_paid: number;
  };
  offeringTitle: string;
}) {
  const payoutReference = `PAY_${args.transactionId}`;

  // Check if payout already created (idempotency)
  const { data: existingPayout } = await supabaseAdmin
    .from("payouts")
    .select("id, status, korapay_reference")
    .eq("transaction_id", args.transactionId)
    .maybeSingle();

  if (existingPayout) {
    console.log("Payout already exists for transaction:", args.transactionId);
    return existingPayout;
  }

  const initialStatus = hasVerifiedBankDetails(args.expert) ? "pending" : "failed";

  const { data: payout, error: insertError } = await supabaseAdmin
    .from("payouts")
    .insert({
      expert_id: args.expert.id,
      transaction_id: args.transactionId,
      amount: args.transaction.amount_paid,
      korapay_reference: payoutReference,
      status: initialStatus,
    })
    .select("*")
    .single();

  if (insertError || !payout) {
    console.error("Unable to create payout record:", insertError);
    return null;
  }

  if (!hasVerifiedBankDetails(args.expert)) {
    console.error(
      `Expert ${args.expert.id} has no verified bank details. Payout ${payoutReference} marked failed.`,
    );
    return payout;
  }

  const { bank_code, bank_account, account_name, email, name } = {
    bank_code: args.expert.bank_code!,
    bank_account: args.expert.bank_account!,
    account_name: args.expert.account_name!,
    email: args.expert.email,
    name: args.expert.name,
  };

  try {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    const payoutResponse = await disburseFlutterwavePayout({
      reference: payoutReference,
      amount: Number(args.transaction.amount_paid),
      bankCode: bank_code,
      bankAccount: bank_account,
      accountName: account_name,
      email,
      narration: `Intellink payout for ${args.offeringTitle}`,
      callbackUrl: `${BASE_URL}/api/payment/webhook`,
    });

    // Flutterwave transfer is almost always immediately "NEW" or "PENDING"
    // It will finalise via the transfer.completed webhook
    const payoutStatus =
      payoutResponse.data?.status === "SUCCESSFUL" ? "success" : "pending";

    await supabaseAdmin
      .from("payouts")
      .update({ status: payoutStatus })
      .eq("id", payout.id);

    if (payoutStatus === "success") {
      try {
        await sendPayoutReceivedEmail(
          email,
          name,
          formatCurrency(Number(args.transaction.amount_paid)),
          args.transaction.client_name,
        );
      } catch (emailError) {
        console.error("Immediate payout email failed:", emailError);
      }
    }

    console.log("Flutterwave payout initiated:", {
      reference: payoutReference,
      status: payoutStatus,
    });

    return payout;
  } catch (error) {
    console.error("Flutterwave payout initiation failed:", error);
    await supabaseAdmin
      .from("payouts")
      .update({ status: "failed" })
      .eq("id", payout.id);
    return payout;
  }
}

async function handlePayoutTransferEvent(status: string, reference?: string) {
  if (!reference) {
    return apiError("Missing payout reference", 400);
  }

  const { data: payout } = await supabaseAdmin
    .from("payouts")
    .select(
      `
        id,
        amount,
        status,
        korapay_reference,
        transaction_id,
        transaction:transaction_id(client_name),
        expert:expert_id(id, name, email)
      `,
    )
    .eq("korapay_reference", reference)
    .single();

  if (!payout) {
    console.error("Payout not found for reference:", reference);
    return apiError("Payout not found", 404);
  }

  const nextStatus = status === "SUCCESSFUL" ? "success" : "failed";
  const shouldSendEmail = payout.status !== "success" && nextStatus === "success";

  await supabaseAdmin
    .from("payouts")
    .update({ status: nextStatus })
    .eq("id", payout.id);

  if (shouldSendEmail) {
    const expert = Array.isArray(payout.expert) ? payout.expert[0] : payout.expert;
    const transaction = Array.isArray(payout.transaction)
      ? payout.transaction[0]
      : payout.transaction;

    if (expert?.email && expert?.name) {
      try {
        await sendPayoutReceivedEmail(
          expert.email,
          expert.name,
          formatCurrency(Number(payout.amount)),
          transaction?.client_name ?? "a client",
        );
      } catch (error) {
        console.error("Payout email failed:", error);
      }
    }
  }

  return apiResponse({ reference, status: nextStatus }, "Payout webhook processed");
}
