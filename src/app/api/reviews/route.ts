import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { apiError, apiResponse, validateRequired } from "@/lib/auth";
import { sendExpertRestrictedEmail } from "@/lib/email";
import { evaluateExpertTrust, getReviewableTransaction } from "@/lib/reviews";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string | number>;
    const { valid, missing } = validateRequired(body, [
      "reference",
      "token",
      "stars",
    ]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const reference = String(body.reference).trim();
    const token = String(body.token).trim();
    const stars = Number(body.stars);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return apiError("Stars must be a whole number between 1 and 5.");
    }

    const transaction = await getReviewableTransaction(reference, token);

    if (!transaction) {
      return apiError("This review link is invalid or has already expired.", 404);
    }

    if (transaction.status !== "success") {
      return apiError(
        "Reviews are only available after a successful purchase.",
        400,
      );
    }

    if (transaction.rating) {
      return apiError("A review has already been submitted for this purchase.", 409);
    }

    const { data: rating, error } = await supabaseAdmin
      .from("ratings")
      .insert({
        transaction_id: transaction.id,
        expert_id: transaction.expert_id,
        stars,
        comment: comment || null,
      })
      .select("id, stars, comment, created_at")
      .single();

    if (error || !rating) {
      if (error?.code === "23505") {
        return apiError(
          "A review has already been submitted for this purchase.",
          409,
        );
      }

      return apiError("Unable to save your review.", 400);
    }

    const trustResult = await evaluateExpertTrust(transaction.expert_id);

    if (
      trustResult?.restrictedNow &&
      trustResult.expert.email &&
      trustResult.expert.name
    ) {
      try {
        await sendExpertRestrictedEmail(
          trustResult.expert.email,
          trustResult.expert.name,
          trustResult.summary.oneStarReviewsThisWeek,
        );
      } catch (emailError) {
        console.error("Restricted expert email failed:", emailError);
      }
    }

    if (transaction.expert?.username) {
      revalidatePath(`/${transaction.expert.username}`);
    }

    revalidatePath(`/review/${reference}`);
    revalidatePath("/discover");
    revalidateTag("marketplace-snapshot");

    return apiResponse(
      {
        rating,
        trust_status: trustResult?.restricted ? "restricted" : "good",
        one_star_reviews_this_week:
          trustResult?.summary.oneStarReviewsThisWeek ?? 0,
      },
      "Review submitted successfully",
      201,
    );
  } catch (error) {
    console.error("Review submission error:", error);
    return apiError("Internal server error", 500);
  }
}
