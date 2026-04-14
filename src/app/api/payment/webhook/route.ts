import { NextRequest } from "next/server";
import { apiError, apiResponse, hasVerifiedBankDetails } from "@/lib/auth";
import {
  createSubscriptionExpiry,
  disburseKorapayPayout,
  verifyKorapaySignature,
} from "@/lib/korapay";
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
    const signature =
      request.headers.get("x-korapay-signature") ||
      request.headers.get("X-Korapay-Signature");

    console.log("Webhook received - signature present:", !!signature);
    console.log("Webhook raw body:", rawBody.substring(0, 500));

    const payload = JSON.parse(rawBody) as {
      event?: string;
      data?: {
        reference?: string;
        payment_reference?: string;
        status?: string;
        amount?: number;
      };
    };

    // Korapay signature is calculated on the data object only
    const dataString = JSON.stringify(payload.data);
    console.log("Webhook data string for signature:", dataString.substring(0, 500));

    if (!signature || !verifyKorapaySignature(signature, dataString)) {
      console.error("Webhook signature verification failed");
      return apiError("Invalid webhook signature", 401);
    }

    console.log("Webhook event:", payload.event);
    const reference = payload.data?.payment_reference || payload.data?.reference;

    console.log("Webhook reference:", reference);

    if (payload.event === "transfer.success" || payload.event === "transfer.failed") {
      return handlePayoutTransferEvent(payload.event, payload.data?.reference);
    }

    if (payload.event === "charge.failed") {
      console.log("Processing charge.failed:", reference);
      return handleChargeFailed(reference);
    }

    if (payload.event !== "charge.success") {
      console.log("Webhook event ignored:", payload.event);
      return apiResponse(null, "Event ignored");
    }

    if (!reference) {
      console.error("Webhook missing payment reference");
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

    console.log("Webhook reference type ignored:", reference);
    return apiResponse(null, "Reference type ignored");
  } catch (error) {
    console.error("Webhook error:", error);
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
    return apiError("Subscription not found", 404);
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
    {
      reference,
      plan: subscription.plan,
    },
    "Subscription activated successfully",
  );
}

async function handleTransactionCharge(reference: string) {
  const result = await processTransactionCharge(reference);

  if (!result) {
    return apiError("Transaction context missing", 404);
  }

  // Initiate expert payout
  const [{ data: expert }, { data: transaction }] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select(
        "id, name, email, bank_code, bank_account, account_name, korapay_recipient_verified",
      )
      .eq(
        "id",
        (
          await supabaseAdmin
            .from("transactions")
            .select("expert_id")
            .eq("korapay_reference", reference)
            .single()
        ).data?.expert_id ?? "",
      )
      .single(),
    supabaseAdmin
      .from("transactions")
      .select("id, client_name, amount_paid, offering_id")
      .eq("korapay_reference", reference)
      .single(),
  ]);

  if (expert && transaction && !result.alreadyProcessed) {
    const { data: offering } = await supabaseAdmin
      .from("offerings")
      .select("title")
      .eq("id", transaction.offering_id)
      .single();

    await initiateExpertPayout({
      transactionId: transaction.id,
      expert,
      transaction,
      offeringTitle: offering?.title ?? "Expert offering",
    });
  }

  return apiResponse(
    {
      reference,
      transaction_id: result.transactionId,
    },
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

  const { data: existingPayout } = await supabaseAdmin
    .from("payouts")
    .select("id, status, korapay_reference")
    .eq("transaction_id", args.transactionId)
    .maybeSingle();

  if (existingPayout) {
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
      `Expert ${args.expert.id} is missing verified bank details for payout ${payoutReference}.`,
    );
    return payout;
  }

  const bankCode = args.expert.bank_code;
  const bankAccount = args.expert.bank_account;
  const accountName = args.expert.account_name;

  if (!bankCode || !bankAccount || !accountName) {
    return payout;
  }

  try {
    const payoutResponse = await disburseKorapayPayout({
      reference: payoutReference,
      amount: Number(args.transaction.amount_paid),
      bankCode,
      bankAccount,
      accountName,
      email: args.expert.email,
      narration: `Intellink payout for ${args.offeringTitle}`,
      metadata: {
        transaction_id: args.transactionId,
        expert_id: args.expert.id,
      },
    });

    const payoutStatus =
      payoutResponse.data?.status === "success" ? "success" : "pending";

    await supabaseAdmin
      .from("payouts")
      .update({
        status: payoutStatus,
      })
      .eq("id", payout.id);

    if (payoutStatus === "success") {
      try {
        await sendPayoutReceivedEmail(
          args.expert.email,
          args.expert.name,
          formatCurrency(Number(args.transaction.amount_paid)),
          args.transaction.client_name,
        );
      } catch (error) {
        console.error("Immediate payout email failed:", error);
      }
    }

    return payout;
  } catch (error) {
    console.error("Korapay payout initiation failed:", error);
    // Don't fail the payment - just mark payout as failed
    await supabaseAdmin
      .from("payouts")
      .update({
        status: "failed",
      })
      .eq("id", payout.id);

    return payout;
  }
}

async function handlePayoutTransferEvent(
  event: "transfer.success" | "transfer.failed",
  reference?: string,
) {
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
    return apiError("Payout not found", 404);
  }

  const nextStatus = event === "transfer.success" ? "success" : "failed";
  const shouldSendEmail = payout.status !== "success" && nextStatus === "success";

  await supabaseAdmin
    .from("payouts")
    .update({
      status: nextStatus,
    })
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

  return apiResponse(
    {
      reference,
      status: nextStatus,
    },
    "Payout webhook processed successfully",
  );
}
