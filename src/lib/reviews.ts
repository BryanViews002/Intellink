import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { type ExpertReviewSummary, type TransactionContext } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
export const WEEKLY_ONE_STAR_LIMIT = 10;
export const REVIEW_WINDOW_DAYS = 7;

export function createReviewToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function buildReviewPath(reference: string, token: string) {
  const params = new URLSearchParams({
    token,
  });

  return `/review/${reference}?${params.toString()}`;
}

export function buildReviewUrl(reference: string, token: string) {
  return `${BASE_URL}${buildReviewPath(reference, token)}`;
}

export async function getReviewableTransaction(reference: string, token: string) {
  const { data: transaction } = await supabaseAdmin
    .from("transactions")
    .select(
      `
        id,
        korapay_reference,
        status,
        offering_type,
        amount_paid,
        created_at,
        client_name,
        client_email,
        expert_id,
        metadata,
        users:expert_id(id, name, username, email, trust_status),
        offerings:offering_id(title)
      `,
    )
    .eq("korapay_reference", reference)
    .maybeSingle();

  if (!transaction) {
    return null;
  }

  const metadata = (transaction.metadata ?? {}) as TransactionContext;

  if (!metadata.reviewToken || metadata.reviewToken !== token) {
    return null;
  }

  const { data: rating } = await supabaseAdmin
    .from("ratings")
    .select("id, stars, comment, created_at")
    .eq("transaction_id", transaction.id)
    .maybeSingle();

  const expert = Array.isArray(transaction.users)
    ? transaction.users[0]
    : transaction.users;
  const offering = Array.isArray(transaction.offerings)
    ? transaction.offerings[0]
    : transaction.offerings;

  return {
    id: transaction.id,
    korapay_reference: transaction.korapay_reference,
    status: transaction.status,
    offering_type: transaction.offering_type,
    amount_paid: Number(transaction.amount_paid ?? 0),
    created_at: transaction.created_at,
    client_name: transaction.client_name,
    client_email: transaction.client_email,
    expert_id: transaction.expert_id,
    reviewToken: metadata.reviewToken,
    expert: expert
      ? {
          id: expert.id,
          name: expert.name,
          username: expert.username,
          email: expert.email,
          trust_status: expert.trust_status,
        }
      : null,
    offering: offering
      ? {
          title: offering.title,
        }
      : null,
    rating: rating
      ? {
          id: rating.id,
          stars: rating.stars,
          comment: rating.comment,
          created_at: rating.created_at,
        }
      : null,
  };
}

export async function getExpertReviewSummary(
  expertId: string,
): Promise<ExpertReviewSummary> {
  const start = new Date();
  start.setDate(start.getDate() - REVIEW_WINDOW_DAYS);

  const { data: ratings } = await supabaseAdmin
    .from("ratings")
    .select("stars, created_at")
    .eq("expert_id", expertId);

  const normalizedRatings = ratings ?? [];
  const totalReviews = normalizedRatings.length;
  const totalStars = normalizedRatings.reduce((sum, rating) => {
    return sum + Number(rating.stars ?? 0);
  }, 0);
  const oneStarReviewsThisWeek = normalizedRatings.filter((rating) => {
    return (
      Number(rating.stars) === 1 &&
      new Date(rating.created_at).getTime() >= start.getTime()
    );
  }).length;

  return {
    averageStars: totalReviews > 0 ? totalStars / totalReviews : 0,
    totalReviews,
    oneStarReviewsThisWeek,
  };
}

export async function evaluateExpertTrust(expertId: string) {
  const { data: expert } = await supabaseAdmin
    .from("users")
    .select("id, name, email, trust_status")
    .eq("id", expertId)
    .single();

  if (!expert) {
    return null;
  }

  const summary = await getExpertReviewSummary(expertId);
  const shouldRestrict = summary.oneStarReviewsThisWeek >= WEEKLY_ONE_STAR_LIMIT;
  const restrictedNow = shouldRestrict && expert.trust_status !== "restricted";

  if (restrictedNow) {
    await supabaseAdmin
      .from("users")
      .update({
        trust_status: "restricted",
        trust_flagged_at: new Date().toISOString(),
        trust_reason: `Automatically restricted after ${summary.oneStarReviewsThisWeek} one-star reviews in ${REVIEW_WINDOW_DAYS} days.`,
      })
      .eq("id", expertId);
  }

  return {
    expert,
    summary,
    restricted: shouldRestrict || expert.trust_status === "restricted",
    restrictedNow,
  };
}
