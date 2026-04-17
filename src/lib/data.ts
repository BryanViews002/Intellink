import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase";
import {
  canExpertAcceptPurchases,
  getUserProfile,
  hasVerifiedBankDetails,
  requireAdminUser,
  syncSubscriptionStatus,
} from "@/lib/auth";
import { calculateDaysRemaining } from "@/lib/format";
import { listNigerianBanks } from "@/lib/flutterwave";
import { getExpertReviewSummary } from "@/lib/reviews";
import {
  type ExpertReview,
  type MarketplaceListing,
  type OfferingType,
} from "@/types";

export async function requireDashboardUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await syncSubscriptionStatus(user.id);

  if (!profile) {
    redirect("/register");
  }

  if (profile.subscription_status !== "active") {
    redirect("/pricing");
  }

  return {
    authUser: user,
    profile,
  };
}

export async function requireVerifiedDashboardUser() {
  const context = await requireDashboardUser();

  if (!hasVerifiedBankDetails(context.profile)) {
    redirect("/dashboard/bank-details");
  }

  return context;
}

async function getRecentExpertReviews(
  expertId: string,
  limit = 5,
): Promise<ExpertReview[]> {
  const { data: ratings } = await supabaseAdmin
    .from("ratings")
    .select(
      `
        id,
        stars,
        comment,
        created_at,
        transactions!inner(
          client_name,
          offering_type,
          offerings(title)
        )
      `,
    )
    .eq("expert_id", expertId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (ratings ?? []).map((rating) => {
    const transaction = Array.isArray(rating.transactions)
      ? rating.transactions[0]
      : rating.transactions;

    const offering = transaction
      ? Array.isArray(transaction.offerings)
        ? transaction.offerings[0]
        : transaction.offerings
      : null;

    return {
      id: String(rating.id),
      stars: Number(rating.stars),
      comment: rating.comment ? String(rating.comment) : null,
      created_at: String(rating.created_at),
      client_name: transaction?.client_name
        ? String(transaction.client_name)
        : "Anonymous",
      offering_type: transaction?.offering_type
        ? String(transaction.offering_type)
        : "unknown",
      offering_title: offering?.title ? String(offering.title) : null,
    } as ExpertReview;
  });
}

export async function getDashboardData(userId: string) {
  const profile = await getUserProfile(userId);

  if (!profile) {
    return null;
  }

  const [
    { data: offerings },
    { data: rawTransactions },
    { data: payouts },
    { data: questions },
    { data: sessions },
    reviews,
    reviewSummary,
  ] = await Promise.all([
    supabaseAdmin
      .from("offerings")
      .select("id, type, title, description, price, is_active, file_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("transactions")
      .select(
        `id, client_name, client_email, offering_type, amount_paid, status, created_at, offering_id,
         offerings(title)`,
      )
      .eq("expert_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("payouts")
      .select("id, amount, status, created_at, korapay_reference")
      .eq("expert_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("questions")
      .select(
        `id, question_text, is_answered, created_at,
         transactions!inner(client_name, expert_id)`,
      )
      .eq("transactions.expert_id", userId)
      .eq("is_answered", false)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("sessions")
      .select(
        `id, scheduled_time, status, created_at,
         transactions!inner(client_name, expert_id)`,
      )
      .eq("transactions.expert_id", userId)
      .order("scheduled_time", { ascending: true })
      .limit(10),
    getRecentExpertReviews(userId, 5),
    getExpertReviewSummary(userId),
  ]);

  // Flatten the offering title join onto each transaction row
  const transactions = (rawTransactions ?? []).map((t) => {
    const offering = Array.isArray(t.offerings) ? t.offerings[0] : t.offerings;
    return {
      ...t,
      offering_title: offering?.title ?? null,
    };
  });

  // Flatten the transaction join onto questions / sessions
  const mappedQuestions = (questions ?? []).map((q) => {
    const tx = Array.isArray(q.transactions) ? q.transactions[0] : q.transactions;
    return {
      id: String(q.id),
      question_text: String(q.question_text),
      is_answered: Boolean(q.is_answered),
      created_at: String(q.created_at),
      client_name: tx?.client_name ? String(tx.client_name) : "Client",
    };
  });

  const mappedSessions = (sessions ?? []).map((s) => {
    const tx = Array.isArray(s.transactions) ? s.transactions[0] : s.transactions;
    return {
      id: String(s.id),
      scheduled_time: String(s.scheduled_time),
      status: String(s.status),
      created_at: String(s.created_at),
      client_name: tx?.client_name ? String(tx.client_name) : "Client",
    };
  });

  const daysRemaining = profile.subscription_expires_at
    ? calculateDaysRemaining(profile.subscription_expires_at)
    : null;

  const totalEarned = transactions
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + Number(t.amount_paid ?? 0), 0);

  return {
    profile,
    offerings: offerings ?? [],
    transactions,
    questions: mappedQuestions,
    sessions: mappedSessions,
    payouts: payouts ?? [],
    reviews,
    reviewSummary,
    daysRemaining,
    totalEarned,
  };
}

export async function getPublicProfile(username: string) {
  const { data: expert } = await supabaseAdmin
    .from("users")
    .select(
      "id, name, username, bio, profile_photo, subscription_status, bank_code, bank_account, account_name, korapay_recipient_verified, trust_status",
    )
    .eq("username", username)
    .single();

  if (!expert) {
    return null;
  }

  const [{ data: offerings }, reviews, reviewSummary] = await Promise.all([
    supabaseAdmin
      .from("offerings")
      .select("id, type, title, description, price, file_url")
      .eq("user_id", expert.id)
      .order("created_at", { ascending: false }),
    getRecentExpertReviews(expert.id, 6),
    getExpertReviewSummary(expert.id),
  ]);

  return {
    expert,
    offerings: offerings ?? [],
    reviews,
    reviewSummary,
    isAvailable: canExpertAcceptPurchases(expert),
  };
}

export async function getPublicOffering(username: string, offeringId: string) {
  console.log("getPublicOffering called:", { username, offeringId });

  const profile = await getPublicProfile(username);

  if (!profile) {
    console.log("getPublicOffering: profile not found for username:", username);
    return null;
  }

  console.log("getPublicOffering: profile found, offerings count:", profile.offerings.length);

  const offering = profile.offerings.find((item) => String(item.id) === String(offeringId));

  if (!offering) {
    console.log("getPublicOffering: offering not found", {
      offeringId,
      availableIds: profile.offerings.map((o) => String(o.id)),
    });
    return null;
  }

  console.log("getPublicOffering: offering found:", offering.id);

  return {
    expert: profile.expert,
    offering,
    isAvailable: profile.isAvailable,
  };
}

type MarketplaceOptions = {
  query?: string;
  type?: OfferingType | "all";
  limit?: number;
};

const getMarketplaceSnapshot = unstable_cache(
  async (limit: number) => {
    const { data } = await supabaseAdmin
      .from("offerings")
      .select(
        `
          id,
          type,
          title,
          description,
          price,
          created_at,
          users!inner(
            id,
            name,
            username,
            bio,
            profile_photo,
            subscription_status,
            korapay_recipient_verified,
            trust_status
          )
        `,
      )
      .eq("is_active", true)
      .eq("users.subscription_status", "active")
      .eq("users.korapay_recipient_verified", true)
      .eq("users.trust_status", "good")
      .order("created_at", { ascending: false })
      .limit(limit);

    return data ?? [];
  },
  ["marketplace-snapshot"],
  {
    revalidate: 300,
    tags: ["marketplace-snapshot"],
  },
);

export async function getMarketplaceData({
  query = "",
  type = "all",
  limit = 24,
}: MarketplaceOptions = {}) {
  let data: Array<Record<string, unknown>> | null = null;
  const snapshotLimit = Math.max(limit, 48);

  try {
    const result = await Promise.race([
      getMarketplaceSnapshot(snapshotLimit),
      new Promise<Array<Record<string, unknown>>>((resolve) => {
        setTimeout(() => resolve([]), 2500);
      }),
    ]);

    data = result;
  } catch (error) {
    console.error("Failed to load marketplace data:", error);
  }

  const listings: MarketplaceListing[] = (data ?? [])
    .map((item) => {
      const expert = Array.isArray(item.users) ? item.users[0] : item.users;

      if (!expert) {
        return null;
      }

      return {
        id: String(item.id),
        type: item.type as OfferingType,
        title: String(item.title),
        description: String(item.description),
        price: Number(item.price),
        created_at: String(item.created_at),
        expert: {
          id: String(expert.id),
          name: String(expert.name),
          username: String(expert.username),
          bio: expert.bio ? String(expert.bio) : null,
          profile_photo: expert.profile_photo ? String(expert.profile_photo) : null,
        },
      };
    })
    .filter((item): item is MarketplaceListing => Boolean(item));

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = listings.filter((listing) => {
    if (type !== "all" && listing.type !== type) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      listing.title,
      listing.description,
      listing.expert.name,
      listing.expert.username,
      listing.expert.bio ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  const experts = new Map(
    listings.map((listing) => [listing.expert.id, listing.expert]),
  );

  return {
    query: query.trim(),
    type,
    totalExperts: experts.size,
    totalListings: listings.length,
    listings: filtered.slice(0, limit),
    featuredExperts: Array.from(experts.values()).slice(0, 6),
  };
}

export async function getCurrentAdminContext() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = await requireAdminUser(user);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return user;
}

export async function getAdminStats() {
  const [{ count: activeSubscriptions }, { data: subscriptions }, { data: transactions }] =
    await Promise.all([
      supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("subscription_status", "active"),
      supabaseAdmin
        .from("users")
        .select(
          "id, name, email, username, subscription_plan, subscription_status, subscription_expires_at, trust_status, trust_flagged_at, trust_reason, created_at",
        )
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("transactions")
        .select(
          `
            id,
            client_name,
            client_email,
            amount_paid,
            status,
            created_at,
            offering_type,
            users:expert_id(name, username)
          `,
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthSubscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("amount, status, created_at")
    .eq("status", "active")
    .gte("created_at", startOfMonth.toISOString());

  const monthlyRevenue = (monthSubscriptions ?? []).reduce((total, item) => {
    return total + Number(item.amount ?? 0);
  }, 0);

  const expiredSubscriptions = (subscriptions ?? []).filter((item) => {
    if (!item.subscription_expires_at) {
      return true;
    }

    return new Date(item.subscription_expires_at).getTime() <= Date.now();
  });

  const restrictedExperts = (subscriptions ?? []).filter((item) => {
    return item.trust_status === "restricted";
  });

  return {
    activeSubscriptions: activeSubscriptions ?? 0,
    monthlyRevenue,
    subscribers: subscriptions ?? [],
    transactions: transactions ?? [],
    expiredSubscriptions,
    restrictedExperts,
  };
}

export async function getBankDetailsPageData(userId: string) {
  const profile = await getUserProfile(userId);

  if (!profile) {
    return null;
  }

  let banks = [] as Awaited<ReturnType<typeof listNigerianBanks>>;

  try {
    if (!process.env.FLW_SECRET_KEY) {
      console.error("FLW_SECRET_KEY is not configured for bank list loading");
    } else {
      banks = await listNigerianBanks();
      console.log(`Loaded ${banks.length} Nigerian banks from Flutterwave`);
    }
  } catch (error) {
    console.error("Failed to load Flutterwave bank list:", error);

    if (error instanceof Error) {
      console.error("Bank list error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  return {
    profile,
    banks,
    bankVerified: hasVerifiedBankDetails(profile),
  };
}