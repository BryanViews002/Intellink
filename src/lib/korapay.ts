import crypto from "node:crypto";
import {
  type NigerianBank,
  type SubscriptionPlan,
  type TransactionContext,
} from "@/types";
import { OFFERING_TYPE_OPTIONS, SUBSCRIPTION_PLANS } from "@/lib/constants";

const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY?.trim() ?? "";
const KORAPAY_PUBLIC_KEY = process.env.KORAPAY_PUBLIC_KEY?.trim() ?? "";
const KORAPAY_API_URL = "https://api.korapay.com/merchant/api/v1";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

type KorapayCustomer = {
  name: string;
  email: string;
};

type KorapayInitializeOptions = {
  amount: number;
  reference: string;
  customer: KorapayCustomer;
  redirectPath: string;
  metadata: Record<string, unknown>;
};

type KorapayResolveAccountResponse = {
  status: boolean;
  message: string;
  data?: {
    bank_name: string;
    bank_code: string;
    account_number: string;
    account_name: string;
  } | null;
};

type KorapayListBanksResponse = {
  status: boolean;
  message: string;
  data?: NigerianBank[] | null;
};

type KorapayDisburseResponse = {
  status: boolean;
  message: string;
  data?: {
    amount?: string | number;
    fee?: string | number;
    currency?: string;
    status?: string;
    reference?: string;
    narration?: string;
    message?: string;
  } | null;
};

type KorapayChargeVerificationResponse = {
  status: boolean;
  message: string;
  data?: {
    reference?: string;
    status?: string;
    transaction_status?: string;
    amount?: number | string;
    currency?: string;
  } | null;
};

export function buildSubscriptionReference(userId: string) {
  return `SUB_${userId.slice(0, 8)}_${Date.now()}`;
}

export function buildTransactionReference(offeringId: string) {
  return `INTLNK_${offeringId.slice(0, 8)}_${Date.now()}`;
}

export function getPlanAmount(plan: SubscriptionPlan) {
  return SUBSCRIPTION_PLANS[plan].price;
}

export function getPlanDurationDays(plan: SubscriptionPlan) {
  return SUBSCRIPTION_PLANS[plan].durationDays;
}

export function createSubscriptionExpiry(plan: SubscriptionPlan) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + getPlanDurationDays(plan));
  return expiresAt;
}

export function verifyKorapaySignature(signature: string, payload: string) {
  if (!KORAPAY_SECRET_KEY) {
    console.error("verifyKorapaySignature: KORAPAY_SECRET_KEY is not configured");
    return false;
  }

  const digest = crypto
    .createHmac("sha256", KORAPAY_SECRET_KEY)
    .update(payload)
    .digest("hex");

  const normalizedSignature = signature.trim().toLowerCase();
  const normalizedDigest = digest.toLowerCase();

  console.log("verifyKorapaySignature:", {
    signaturePresent: !!signature,
    signaturePrefix: signature ? signature.substring(0, 20) : null,
    digestPrefix: digest.substring(0, 20),
    keyConfigured: !!KORAPAY_SECRET_KEY,
    keyPrefix: KORAPAY_SECRET_KEY.substring(0, 8),
    match: normalizedSignature === normalizedDigest,
  });

  if (normalizedSignature.length !== normalizedDigest.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(normalizedSignature),
    Buffer.from(normalizedDigest),
  );
}

export async function initializeKorapayPayment({
  amount,
  reference,
  customer,
  redirectPath,
  metadata,
}: KorapayInitializeOptions) {
  if (!KORAPAY_SECRET_KEY) {
    throw new Error("KORAPAY_SECRET_KEY is missing");
  }

  console.log("Initializing Korapay payment:", { amount, reference, customer, redirectPath });

  const response = await fetch(`${KORAPAY_API_URL}/charges/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount,
      currency: "NGN",
      reference,
      customer,
      notification_url: `${BASE_URL}/api/payment/webhook`,
      redirect_url: `${BASE_URL}${redirectPath}`,
      metadata,
    }),
  });

  const rawText = await response.text();
  console.log("Korapay initialize response status:", response.status);
  console.log("Korapay initialize raw response:", rawText.substring(0, 500));

  let payload = null;
  try {
    payload = JSON.parse(rawText);
  } catch {
    console.error("Failed to parse Korapay initialize response as JSON");
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error?.message ||
      "Unable to initialize Korapay payment";
    throw new Error(message);
  }

  return payload;
}

export async function verifyKorapayCharge(reference: string) {
  if (!KORAPAY_SECRET_KEY) {
    throw new Error("KORAPAY_SECRET_KEY is missing");
  }

  const response = await fetch(`${KORAPAY_API_URL}/charges/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
    },
    cache: "no-store",
  });

  const payload =
    (await response.json().catch(() => null)) as KorapayChargeVerificationResponse | null;

  if (!response.ok || !payload) {
    return {
      status: false,
      message: payload?.message || "Unable to verify charge",
      data: null,
    };
  }

  return payload;
}

export async function listNigerianBanks() {
  if (!KORAPAY_PUBLIC_KEY) {
    throw new Error("KORAPAY_PUBLIC_KEY is missing");
  }

  console.log("Fetching Nigerian banks from Korapay...");
  console.log("API URL:", KORAPAY_API_URL);
  console.log("Public key prefix:", KORAPAY_PUBLIC_KEY.substring(0, 8) + "...");
  console.log("Public key length:", KORAPAY_PUBLIC_KEY.length);

  const response = await fetch(
    `${KORAPAY_API_URL}/misc/banks?countryCode=NG`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${KORAPAY_PUBLIC_KEY}`,
      },
      cache: "no-store",
    },
  );

  const rawText = await response.text();
  console.log("Korapay banks response status:", response.status);
  console.log("Korapay banks raw response:", rawText.substring(0, 500));

  let payload: KorapayListBanksResponse | null = null;
  try {
    payload = JSON.parse(rawText) as KorapayListBanksResponse;
  } catch {
    console.error("Failed to parse Korapay banks response as JSON");
  }

  if (!response.ok || !payload?.status) {
    console.error("Korapay API error details:", {
      status: response.status,
      statusText: response.statusText,
      payload,
      authHeader: `Bearer ${KORAPAY_PUBLIC_KEY.substring(0, 8)}...`,
    });
    throw new Error(payload?.message || `Unable to load Nigerian banks (HTTP ${response.status})`);
  }

  console.log(`Loaded ${payload.data?.length ?? 0} banks from Korapay`);
  
  // Log first bank to check structure
  if (payload.data && payload.data.length > 0) {
    console.log("First bank structure:", JSON.stringify(payload.data[0]));
  }

  return payload.data ?? [];
}

export async function resolveNigerianBankAccount(args: {
  bankCode: string;
  accountNumber: string;
}) {
  if (!KORAPAY_SECRET_KEY) {
    throw new Error("KORAPAY_SECRET_KEY is missing");
  }

  console.log("Resolving bank account:", { bankCode: args.bankCode, accountNumber: args.accountNumber });

  const response = await fetch(`${KORAPAY_API_URL}/misc/banks/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({
      bank: args.bankCode,
      account: args.accountNumber,
      currency: "NGN",
    }),
    cache: "no-store",
  });

  const rawText = await response.text();
  console.log("Korapay resolve response status:", response.status);
  console.log("Korapay resolve raw response:", rawText.substring(0, 500));

  let payload: KorapayResolveAccountResponse | null = null;
  try {
    payload = JSON.parse(rawText) as KorapayResolveAccountResponse;
  } catch {
    console.error("Failed to parse Korapay resolve response as JSON");
  }

  if (!response.ok || !payload?.status || !payload.data) {
    throw new Error(payload?.message || `Unable to verify bank account (HTTP ${response.status})`);
  }

  console.log("Bank account resolved successfully:", payload.data.account_name);

  return payload.data;
}

export async function disburseKorapayPayout(args: {
  reference: string;
  amount: number;
  bankCode: string;
  bankAccount: string;
  accountName: string;
  email: string;
  narration?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!KORAPAY_SECRET_KEY) {
    throw new Error("KORAPAY_SECRET_KEY is missing");
  }

  const response = await fetch(`${KORAPAY_API_URL}/transactions/disburse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({
      reference: args.reference,
      destination: {
        type: "bank_account",
        amount: Number(args.amount.toFixed(2)),
        currency: "NGN",
        narration: args.narration,
        bank_account: {
          bank: args.bankCode,
          account: args.bankAccount,
        },
        customer: {
          name: args.accountName,
          email: args.email,
        },
      },
      metadata: args.metadata,
    }),
    cache: "no-store",
  });

  const payload =
    (await response.json().catch(() => null)) as KorapayDisburseResponse | null;

  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message || "Unable to initiate payout");
  }

  return payload;
}

export function buildSubscriptionCheckout(
  plan: SubscriptionPlan,
  user: KorapayCustomer & { id: string },
) {
  const reference = buildSubscriptionReference(user.id);

  return {
    amount: getPlanAmount(plan),
    reference,
    redirectPath: `/payment/success?type=subscription&reference=${reference}`,
    metadata: {
      kind: "subscription",
      plan,
      user_id: user.id,
    },
    customer: {
      name: user.name,
      email: user.email,
    },
  };
}

export function buildTransactionCheckout(args: {
  amount: number;
  offeringId: string;
  customer: KorapayCustomer;
  expertId: string;
  offeringType: keyof typeof OFFERING_TYPE_OPTIONS;
  context: TransactionContext;
}) {
  const reference = buildTransactionReference(args.offeringId);

  return {
    amount: args.amount,
    reference,
    redirectPath: `/payment/success?type=transaction&reference=${reference}`,
    metadata: {
      kind: "transaction",
      expert_id: args.expertId,
      offering_id: args.offeringId,
      offering_type: args.offeringType,
      review_token: args.context.reviewToken,
    },
    customer: args.customer,
  };
}
