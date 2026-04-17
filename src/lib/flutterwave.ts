import { type NigerianBank, type SubscriptionPlan, type TransactionContext } from "@/types";
import { OFFERING_TYPE_OPTIONS, SUBSCRIPTION_PLANS } from "@/lib/constants";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY?.trim() ?? "";
const FLW_CLIENT_ID = process.env.FLW_CLIENT_ID?.trim() ?? "";
const FLW_CLIENT_SECRET = process.env.FLW_CLIENT_SECRET?.trim() ?? "";
const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH?.trim() ?? "";
const FLW_API_URL = "https://api.flutterwave.com/v3";
const FLW_IDP_URL = "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// Simple in-memory token cache so we don't fetch a new token on every request
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

/**
 * Returns a valid Bearer token.
 * - If FLW_SECRET_KEY is set (standard merchant), uses it directly.
 * - If FLW_CLIENT_ID + FLW_CLIENT_SECRET are set (developer sandbox OAuth), exchanges
 *   them for a short-lived access token via Flutterwave's identity provider.
 */
async function getAuthToken(): Promise<string> {
  // Standard merchant key — use directly
  if (FLW_SECRET_KEY) return FLW_SECRET_KEY;

  // OAuth path
  if (!FLW_CLIENT_ID || !FLW_CLIENT_SECRET) {
    throw new Error("Neither FLW_SECRET_KEY nor FLW_CLIENT_ID/FLW_CLIENT_SECRET are configured");
  }

  // Return cached token if still valid (with 30s buffer)
  if (_cachedToken && Date.now() < _tokenExpiresAt - 30_000) {
    return _cachedToken;
  }

  const body = new URLSearchParams({
    client_id: FLW_CLIENT_ID,
    client_secret: FLW_CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const res = await fetch(FLW_IDP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json() as Record<string, unknown>;

  if (!res.ok || !data.access_token) {
    console.error("Flutterwave OAuth token error:", data);
    throw new Error(`OAuth token fetch failed: ${data.error_description ?? data.error ?? "unknown"}`); 
  }

  _cachedToken = String(data.access_token);
  _tokenExpiresAt = Date.now() + (Number(data.expires_in ?? 300) * 1000);

  console.log("Flutterwave OAuth token obtained, expires in", data.expires_in, "seconds");
  return _cachedToken;
}

type FlutterwaveCustomer = {
  name: string;
  email: string;
};

type FlutterwaveInitializeOptions = {
  amount: number;
  reference: string;
  customer: FlutterwaveCustomer;
  redirectPath: string;
  meta: Record<string, unknown>;
};

type FlutterwaveTransferResponse = {
  status: string;
  message: string;
  data?: {
    id?: number;
    account_number?: string;
    bank_code?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    narration?: string;
    status?: string;
    complete_message?: string;
  } | null;
};

type FlutterwaveVerifyResponse = {
  status: string;
  message: string;
  data?: {
    id?: number;
    tx_ref?: string;
    flw_ref?: string;
    amount?: number;
    currency?: string;
    charged_amount?: number;
    app_fee?: number;
    status?: string;
    payment_type?: string;
    customer?: {
      id?: number;
      name?: string;
      email?: string;
    };
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

/**
 * Verifies that the incoming webhook is from Flutterwave.
 * Flutterwave sends the FLW_SECRET_HASH value directly in the
 * "verifi-hash" header (direct string comparison, not HMAC).
 */
export function verifyFlutterwaveSignature(signature: string): boolean {
  if (!FLW_SECRET_HASH) {
    console.error("verifyFlutterwaveSignature: FLW_SECRET_HASH is not configured");
    return false;
  }
  return signature === FLW_SECRET_HASH;
}

/**
 * Initialise a Flutterwave Standard checkout.
 * Returns the payment link to redirect the customer to.
 */
export async function initializeFlutterwavePayment({
  amount,
  reference,
  customer,
  redirectPath,
  meta,
}: FlutterwaveInitializeOptions) {
  const token = await getAuthToken();

  console.log("Initializing Flutterwave payment:", { amount, reference, customer, redirectPath });

  const response = await fetch(`${FLW_API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tx_ref: reference,
      amount,
      currency: "NGN",
      redirect_url: `${BASE_URL}${redirectPath}`,
      customer: {
        email: customer.email,
        name: customer.name,
      },
      meta,
      customizations: {
        title: "Intellink",
        description: "Secure expert marketplace payment",
      },
    }),
  });

  const rawText = await response.text();
  console.log("Flutterwave initialize response status:", response.status);
  console.log("Flutterwave initialize raw response:", rawText.substring(0, 500));

  let payload = null;
  try {
    payload = JSON.parse(rawText);
  } catch {
    console.error("Failed to parse Flutterwave initialize response as JSON");
  }

  if (!response.ok || !payload || payload.status !== "success") {
    const message = payload?.message || "Unable to initialize Flutterwave payment";
    throw new Error(message);
  }

  return payload;
}

/**
 * Verify a transaction by Flutterwave's numeric transaction ID.
 * Flutterwave appends transaction_id to the redirect URL after payment.
 */
export async function verifyFlutterwaveTransaction(
  transactionId: string | number,
): Promise<FlutterwaveVerifyResponse> {
  const token = await getAuthToken();

  console.log("verifyFlutterwaveTransaction called for id:", transactionId);

  const response = await fetch(`${FLW_API_URL}/transactions/${transactionId}/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  console.log("verifyFlutterwaveTransaction response status:", response.status);

  const payload =
    (await response.json().catch(() => null)) as FlutterwaveVerifyResponse | null;

  console.log(
    "verifyFlutterwaveTransaction payload:",
    JSON.stringify(payload)?.substring(0, 500),
  );

  if (!response.ok || !payload) {
    return {
      status: "error",
      message: payload?.message || "Unable to verify transaction",
      data: null,
    };
  }

  return payload;
}

/**
 * List Nigerian banks via Flutterwave.
 */
export async function listNigerianBanks(): Promise<NigerianBank[]> {
  const token = await getAuthToken();

  console.log("Fetching Nigerian banks from Flutterwave...");

  const response = await fetch(`${FLW_API_URL}/banks/NG`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const rawText = await response.text();
  console.log("Flutterwave banks response status:", response.status);
  console.log("Flutterwave banks raw response:", rawText.substring(0, 500));

  let payload: { status: string; message?: string; data?: { id: number; code: string; name: string }[] } | null = null;
  try {
    payload = JSON.parse(rawText);
  } catch {
    console.error("Failed to parse Flutterwave banks response as JSON");
  }

  if (!response.ok || payload?.status !== "success") {
    throw new Error(payload?.message || `Unable to load Nigerian banks (HTTP ${response.status})`);
  }

  const banks = (payload?.data ?? []).map((bank) => ({
    name: bank.name,
    slug: bank.name.toLowerCase().replace(/[\s/]+/g, "-").replace(/[^a-z0-9-]/g, ""),
    code: bank.code,
    country: "NG",
  })) as NigerianBank[];

  console.log(`Loaded ${banks.length} banks from Flutterwave`);

  return banks;
}

/**
 * Resolve a Nigerian bank account name via Flutterwave.
 */
export async function resolveNigerianBankAccount(args: {
  bankCode: string;
  accountNumber: string;
}) {
  const token = await getAuthToken();

  console.log("Resolving bank account:", {
    bankCode: args.bankCode,
    accountNumber: args.accountNumber,
  });

  const response = await fetch(`${FLW_API_URL}/accounts/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      account_number: args.accountNumber,
      account_bank: args.bankCode,
    }),
    cache: "no-store",
  });

  const rawText = await response.text();
  console.log("Flutterwave resolve response status:", response.status);
  console.log("Flutterwave resolve raw response:", rawText.substring(0, 500));

  let payload: { status: string; message?: string; data?: { account_number: string; account_name: string } } | null = null;
  try {
    payload = JSON.parse(rawText);
  } catch {
    console.error("Failed to parse Flutterwave resolve response as JSON");
  }

  if (!response.ok || payload?.status !== "success" || !payload?.data) {
    // Flutterwave sandbox restricts account resolution to bank code '044' only.
    // If we get this error in test mode, we mock a successful response.
    const isTestMode = FLW_SECRET_KEY && FLW_SECRET_KEY.includes("_TEST-");
    const isSandboxError = payload?.message?.includes("044");

    if (isTestMode && isSandboxError) {
      console.warn("TEST MODE: Bypassing Flutterwave sandbox restrictions for account resolution.");
      return {
        bank_code: args.bankCode,
        bank_name: "",
        account_number: args.accountNumber,
        account_name: "Test Expert Account",
      };
    }

    throw new Error(
      payload?.message || `Unable to verify bank account (HTTP ${response.status})`,
    );
  }

  console.log("Bank account resolved successfully:", payload.data.account_name);

  return {
    bank_code: args.bankCode,
    bank_name: "",
    account_number: payload.data.account_number,
    account_name: payload.data.account_name,
  };
}

/**
 * Disburse a payout to an expert's bank account via Flutterwave transfers.
 */
export async function disburseFlutterwavePayout(args: {
  reference: string;
  amount: number;
  bankCode: string;
  bankAccount: string;
  accountName: string;
  email: string;
  narration?: string;
  callbackUrl?: string;
}) {
  const token = await getAuthToken();

  console.log("disburseFlutterwavePayout:", {
    reference: args.reference,
    amount: args.amount,
    bankCode: args.bankCode,
    bankAccount: args.bankAccount,
  });

  const response = await fetch(`${FLW_API_URL}/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      account_bank: args.bankCode,
      account_number: args.bankAccount,
      amount: Number(args.amount.toFixed(2)),
      narration: args.narration || "Intellink expert payout",
      currency: "NGN",
      reference: args.reference,
      debit_currency: "NGN",
      ...(args.callbackUrl ? { callback_url: args.callbackUrl } : {}),
    }),
    cache: "no-store",
  });

  const payload =
    (await response.json().catch(() => null)) as FlutterwaveTransferResponse | null;

  console.log("disburseFlutterwavePayout response status:", response.status);
  console.log("disburseFlutterwavePayout payload:", JSON.stringify(payload)?.substring(0, 300));

  if (!response.ok || !payload || payload.status !== "success") {
    throw new Error(payload?.message || "Unable to initiate payout via Flutterwave");
  }

  return payload;
}

export function buildSubscriptionCheckout(
  plan: SubscriptionPlan,
  user: FlutterwaveCustomer & { id: string },
) {
  const reference = buildSubscriptionReference(user.id);

  return {
    amount: getPlanAmount(plan),
    reference,
    redirectPath: `/payment/success`,
    meta: {
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
  customer: FlutterwaveCustomer;
  expertId: string;
  offeringType: keyof typeof OFFERING_TYPE_OPTIONS;
  context: TransactionContext;
}) {
  const reference = buildTransactionReference(args.offeringId);

  return {
    amount: args.amount,
    reference,
    redirectPath: `/payment/success`,
    meta: {
      kind: "transaction",
      expert_id: args.expertId,
      offering_id: args.offeringId,
      offering_type: args.offeringType,
      review_token: args.context.reviewToken,
    },
    customer: args.customer,
  };
}
