import { redirect } from "next/navigation";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase";
import {
  getUserProfile,
  hasVerifiedBankDetails,
  requireAdminUser,
  syncSubscriptionStatus,
} from "@/lib/auth";
import { calculateDaysRemaining } from "@/lib/format";
import { listNigerianBanks } from "@/lib/korapay";

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

export async function getDashboardData(userId: string) {
  const profile = await getUserProfile(userId);

  if (!profile) {
    return null;
  }

  const [{ data: questions }, { data: sessions }, { data: transactions }] =
    await Promise.all([
      supabaseAdmin
        .from("questions")
        .select(
          `
            id,
            question_text,
            answer_text,
            is_answered,
            created_at,
            transactions!inner(
              client_name,
              client_email,
              expert_id
            )
          `,
        )
        .eq("transactions.expert_id", userId)
        .eq("is_answered", false)
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("sessions")
        .select(
          `
            id,
            scheduled_time,
            meeting_link,
            status,
            created_at,
            transactions!inner(
              client_name,
              client_email,
              expert_id
            )
          `,
        )
        .eq("transactions.expert_id", userId)
        .order("scheduled_time", { ascending: true })
        .limit(5),
      supabaseAdmin
        .from("transactions")
        .select(
          `
            id,
            client_name,
            amount_paid,
            status,
            created_at,
            offering_type,
            offerings(title)
          `,
        )
        .eq("expert_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const normalizedQuestions = (questions ?? []).map((question) => {
    const transaction = Array.isArray(question.transactions)
      ? question.transactions[0]
      : question.transactions;

    return {
      id: question.id,
      question_text: question.question_text,
      answer_text: question.answer_text,
      is_answered: question.is_answered,
      created_at: question.created_at,
      client_name: transaction?.client_name ?? "Unknown",
      client_email: transaction?.client_email ?? "",
    };
  });

  const normalizedSessions = (sessions ?? []).map((session) => {
    const transaction = Array.isArray(session.transactions)
      ? session.transactions[0]
      : session.transactions;

    return {
      id: session.id,
      scheduled_time: session.scheduled_time,
      meeting_link: session.meeting_link,
      status: session.status,
      created_at: session.created_at,
      client_name: transaction?.client_name ?? "Unknown",
      client_email: transaction?.client_email ?? "",
    };
  });

  const normalizedTransactions = (transactions ?? []).map((transaction) => {
    const offering = Array.isArray(transaction.offerings)
      ? transaction.offerings[0]
      : transaction.offerings;

    return {
      ...transaction,
      offering_title: offering?.title ?? "Untitled offering",
    };
  });

  return {
    profile,
    questions: normalizedQuestions,
    sessions: normalizedSessions,
    transactions: normalizedTransactions,
    daysRemaining: calculateDaysRemaining(profile.subscription_expires_at),
  };
}

export async function getPublicProfile(username: string) {
  const { data: expert } = await supabaseAdmin
    .from("users")
    .select(
      "id, name, bio, profile_photo, subscription_status, subscription_plan, username, korapay_recipient_verified",
    )
    .eq("username", username)
    .single();

  if (!expert) {
    return null;
  }

  let offerings: Array<Record<string, unknown>> = [];

  if (
    expert.subscription_status === "active" &&
    expert.korapay_recipient_verified
  ) {
    const { data } = await supabaseAdmin
      .from("offerings")
      .select("id, type, title, description, price, file_url")
      .eq("user_id", expert.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    offerings = data ?? [];
  }

  return {
    expert,
    offerings,
  };
}

export async function getPublicOffering(username: string, offeringId: string) {
  const profile = await getPublicProfile(username);

  if (!profile) {
    return null;
  }

  const offering = profile.offerings.find((item) => item.id === offeringId);

  if (!offering) {
    return null;
  }

  return {
    expert: profile.expert,
    offering,
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
          "id, name, email, username, subscription_plan, subscription_status, subscription_expires_at, created_at",
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

  return {
    activeSubscriptions: activeSubscriptions ?? 0,
    monthlyRevenue,
    subscribers: subscriptions ?? [],
    transactions: transactions ?? [],
    expiredSubscriptions,
  };
}

export async function getBankDetailsPageData(userId: string) {
  const profile = await getUserProfile(userId);

  if (!profile) {
    return null;
  }

  let banks = [] as Awaited<ReturnType<typeof listNigerianBanks>>;

  try {
    banks = await listNigerianBanks();
  } catch (error) {
    console.error("Failed to load Korapay bank list:", error);
  }

  return {
    profile,
    banks,
    bankVerified: hasVerifiedBankDetails(profile),
  };
}
