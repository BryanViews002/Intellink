import crypto from "node:crypto";
import {
  type NigerianBank,
  type SubscriptionPlan,
  type TransactionContext,
} from "@/types";
import { OFFERING_TYPE_OPTIONS, SUBSCRIPTION_PLANS } from "@/lib/constants";

const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY ?? "";
const KORAPAY_API_URL = "https://api.korapay.com/merchant/api/v1";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const BANK_LIST_TIMEOUT_MS = 4500;

const NIGERIAN_BANKS_FALLBACK: NigerianBank[] = [
  { code: "044", name: "Access Bank", slug: "access-bank", country: "NG" },
  { code: "014", name: "Afribank Nigeria Plc", slug: "afribank", country: "NG" },
  { code: "023", name: "Citibank Nigeria Limited", slug: "citibank-nigeria", country: "NG" },
  { code: "050", name: "Ecobank Nigeria Plc", slug: "ecobank-nigeria", country: "NG" },
  { code: "011", name: "First Bank of Nigeria Plc", slug: "first-bank", country: "NG" },
  { code: "214", name: "First City Monument Bank", slug: "fcmb", country: "NG" },
  { code: "070", name: "Fidelity Bank Plc", slug: "fidelity-bank", country: "NG" },
  { code: "058", name: "Guaranty Trust Bank", slug: "gtbank", country: "NG" },
  { code: "030", name: "Heritage Bank", slug: "heritage-bank", country: "NG" },
  { code: "082", name: "Keystone Bank", slug: "keystone-bank", country: "NG" },
  { code: "221", name: "Stanbic IBTC Bank", slug: "stanbic-ibtc", country: "NG" },
  { code: "068", name: "Standard Chartered Bank", slug: "standard-chartered", country: "NG" },
  { code: "232", name: "Sterling Bank", slug: "sterling-bank", country: "NG" },
  { code: "032", name: "Union Bank of Nigeria", slug: "union-bank", country: "NG" },
  { code: "033", name: "United Bank For Africa", slug: "uba", country: "NG" },
  { code: "215", name: "Unity Bank Plc", slug: "unity-bank", country: "NG" },
  { code: "035", name: "Wema Bank Plc", slug: "wema-bank", country: "NG" },
  { code: "057", name: "Zenith Bank", slug: "zenith-bank", country: "NG" },
  { code: "100004", name: "OPay", slug: "opay", country: "NG" },
  { code: "999992", name: "PalmPay", slug: "palmpay", country: "NG" },
  { code: "090267", name: "Kuda Bank", slug: "kuda-bank", country: "NG" },
];

function normalizeBanks(banks: NigerianBank[]) {
  const seen = new Set<string>();

  return banks
    .filter((bank) => {
      if (!bank?.code || !bank?.name) {
        return false;
      }

      if (seen.has(bank.code)) {
        return false;
      }

      seen.add(bank.code);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

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
    return false;
  }

  const digest = crypto
    .createHmac("sha256", KORAPAY_SECRET_KEY)
    .update(payload)
    .digest("hex");

  const normalizedSignature = signature.trim().toLowerCase();
  const normalizedDigest = digest.toLowerCase();

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

  const payload = await response.json().catch(() => null);

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
  if (!KORAPAY_SECRET_KEY) {
    return normalizeBanks(NIGERIAN_BANKS_FALLBACK);
  }

  let timeout: NodeJS.Timeout | null = null;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), BANK_LIST_TIMEOUT_MS);

    const response = await fetch(
      `${KORAPAY_API_URL}/misc/banks?countryCode=NG`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
        },
        signal: controller.signal,
        next: { revalidate: 60 * 60 * 24 },
      },
    );

    const payload =
      (await response.json().catch(() => null)) as KorapayListBanksResponse | null;

    if (!response.ok || !payload?.status) {
      return normalizeBanks(NIGERIAN_BANKS_FALLBACK);
    }

    return normalizeBanks(payload.data ?? NIGERIAN_BANKS_FALLBACK);
  } catch (error) {
    console.error("Falling back to local bank list:", error);
    return normalizeBanks(NIGERIAN_BANKS_FALLBACK);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function resolveNigerianBankAccount(args: {
  bankCode: string;
  accountNumber: string;
}) {
  if (!KORAPAY_SECRET_KEY) {
    throw new Error("KORAPAY_SECRET_KEY is missing");
  }

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

  const payload =
    (await response.json().catch(() => null)) as KorapayResolveAccountResponse | null;

  if (!response.ok || !payload?.status || !payload.data) {
    throw new Error(payload?.message || "Unable to verify bank account");
  }

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
      context: args.context,
    },
    customer: args.customer,
  };
}
