import { supabaseAdmin } from "@/lib/supabase";
import {
  sendNewQuestionEmail,
  sendResourceDownloadEmail,
  sendResourceSoldEmail,
  sendSessionBookedEmail,
} from "@/lib/email";
import { buildReviewUrl } from "@/lib/reviews";
import { type TransactionContext } from "@/types";

export type ProcessedTransaction = {
  transactionId: string;
  reference: string;
  offeringType: string;
  alreadyProcessed: boolean;
  resourceDownloadUrl: string | null;
  reviewUrl: string | null;
};

/**
 * Core transaction processing logic.
 * Called by both the webhook handler and the payment success page (as a fallback).
 * Idempotent — safe to call multiple times for the same reference.
 */
export async function processTransactionCharge(
  reference: string,
): Promise<ProcessedTransaction | null> {
  const { data: transaction } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("korapay_reference", reference)
    .single();

  if (!transaction) {
    return null;
  }

  const alreadyProcessed = transaction.status === "success";

  if (!alreadyProcessed) {
    await supabaseAdmin
      .from("transactions")
      .update({
        status: "success",
      })
      .eq("id", transaction.id);
  }

  const [{ data: offering }, { data: expert }] = await Promise.all([
    supabaseAdmin
      .from("offerings")
      .select("id, type, title, file_url")
      .eq("id", transaction.offering_id)
      .single(),
    supabaseAdmin
      .from("users")
      .select(
        "id, name, email, bank_code, bank_account, account_name, korapay_recipient_verified",
      )
      .eq("id", transaction.expert_id)
      .single(),
  ]);

  if (!offering || !expert) {
    return null;
  }

  const metadata = (transaction.metadata ?? {}) as TransactionContext;
  const reviewUrl = metadata.reviewToken
    ? buildReviewUrl(reference, metadata.reviewToken)
    : undefined;

  if (!alreadyProcessed && offering.type === "qa") {
    const questionText = metadata.questionText?.trim() || "Question submitted";

    await supabaseAdmin.from("questions").insert({
      transaction_id: transaction.id,
      question_text: questionText,
      is_answered: false,
    });

    try {
      await sendNewQuestionEmail(
        expert.email,
        expert.name,
        transaction.client_name,
        questionText,
      );
    } catch (error) {
      console.error("New question email failed:", error);
    }
  }

  if (!alreadyProcessed && offering.type === "session") {
    const scheduledTime = metadata.preferredTime || new Date().toISOString();

    await supabaseAdmin.from("sessions").insert({
      transaction_id: transaction.id,
      scheduled_time: scheduledTime,
      status: "pending",
    });

    try {
      await sendSessionBookedEmail(
        expert.email,
        expert.name,
        transaction.client_name,
        scheduledTime,
      );
    } catch (error) {
      console.error("Session email failed:", error);
    }
  }

  let resourceDownloadUrl: string | null = null;

  if (offering.type === "resource" && offering.file_url) {
    try {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from("resources")
        .createSignedUrl(offering.file_url, 60 * 60 * 24 * 7);

      if (signedUrlData?.signedUrl) {
        resourceDownloadUrl = signedUrlData.signedUrl;

        if (!alreadyProcessed) {
          try {
            await sendResourceSoldEmail(
              expert.email,
              expert.name,
              transaction.client_name,
              offering.title,
            );
          } catch (error) {
            console.error("Resource sale email failed:", error);
          }

          try {
            await sendResourceDownloadEmail(
              transaction.client_email,
              transaction.client_name,
              offering.title,
              signedUrlData.signedUrl,
              reviewUrl,
            );
          } catch (error) {
            console.error("Resource delivery email failed:", error);
          }
        }
      }
    } catch (error) {
      console.error("Resource signed URL generation failed:", error);
    }
  } else if (!alreadyProcessed && offering.type === "resource") {
    try {
      await sendResourceSoldEmail(
        expert.email,
        expert.name,
        transaction.client_name,
        offering.title,
      );
    } catch (error) {
      console.error("Resource sale email failed:", error);
    }
  }

  return {
    transactionId: transaction.id,
    reference,
    offeringType: offering.type,
    alreadyProcessed,
    resourceDownloadUrl,
    reviewUrl: reviewUrl ?? null,
  };
}
