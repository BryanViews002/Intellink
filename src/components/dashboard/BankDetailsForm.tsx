"use client";

import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type NigerianBank } from "@/types";

type BankDetailsFormProps = {
  banks: NigerianBank[];
  initialValues: {
    bank_code: string | null;
    bank_account: string | null;
    account_name: string | null;
    korapay_recipient_verified: boolean;
  };
};

type ResolvedAccount = {
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
};

export function BankDetailsForm({
  banks,
  initialValues,
}: BankDetailsFormProps) {
  const router = useRouter();
  const [bankCode, setBankCode] = useState(initialValues.bank_code ?? "");
  const [accountNumber, setAccountNumber] = useState(
    initialValues.bank_account ?? "",
  );
  const [message, setMessage] = useState("");
  const [resolvedAccount, setResolvedAccount] = useState<ResolvedAccount | null>(
    initialValues.korapay_recipient_verified &&
      initialValues.bank_code &&
      initialValues.bank_account &&
      initialValues.account_name
      ? {
          bank_name:
            banks.find((bank) => bank.code === initialValues.bank_code)?.name ??
            "Verified bank",
          bank_code: initialValues.bank_code,
          account_number: initialValues.bank_account,
          account_name: initialValues.account_name,
        }
      : null,
  );
  const [isVerifying, startVerification] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const selectedBankName =
    banks.find((bank) => bank.code === bankCode)?.name ?? "Selected bank";

  return (
    <div className="space-y-6">
      <div className="panel motion-shell rise-in overflow-hidden bg-slate-950 p-6 text-white sm:p-8">
        <AmbientBackdrop variant="bank" />
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            Payout setup
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Verify where client payouts should land
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Before an expert can publish offerings, we verify the Nigerian bank
            account that should receive instant payouts after every successful client payment.
          </p>
        </div>
      </div>

      <form
        className="panel rise-in delay-1 space-y-6 p-6 sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        {banks.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Unable to load bank list
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Please check your internet connection or contact support if this persists.
            </p>
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Bank Code {banks.length === 0 && <span className="text-amber-600">(manual entry required)</span>}
            </span>
            {banks.length > 0 ? (
              <select
                value={bankCode}
                onChange={(event) => {
                  setBankCode(event.target.value);
                  setResolvedAccount(null);
                  setMessage("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
              >
                <option value="">Select a bank</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={bankCode}
                onChange={(event) => {
                  setBankCode(event.target.value);
                  setResolvedAccount(null);
                  setMessage("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                placeholder="e.g., 058 (GTBank)"
              />
            )}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Account number
            </span>
            <input
              value={accountNumber}
              onChange={(event) => {
                const nextValue = event.target.value.replace(/\D/g, "");
                setAccountNumber(nextValue);
                setResolvedAccount(null);
                setMessage("");
              }}
              maxLength={10}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
              placeholder="0123456789"
            />
          </label>
        </div>

        {banks.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Bank list unavailable
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Enter your bank code manually. Common codes: GTBank (058), Access (044), FirstBank (011), Zenith (057), UBA (033), Wema (035).
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            disabled={isVerifying || !bankCode || accountNumber.length !== 10}
            onClick={() => {
              setMessage("");

              startVerification(async () => {
                try {
                  const response = await fetch("/api/bank-details/resolve", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      bank_code: bankCode,
                      bank_account: accountNumber,
                    }),
                  });

                  const payload = await response.json();

                  if (!response.ok) {
                    setResolvedAccount(null);
                    setMessage(payload.message || "Unable to verify bank account.");
                    return;
                  }

                  setResolvedAccount(payload.data.account);
                  setMessage("Account verified. Save to continue.");
                } catch (error) {
                  setResolvedAccount(null);
                  setMessage("Network error. Please try again.");
                }
              });
            }}
            className="button-secondary button-block-mobile disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifying ? "Verifying..." : "Verify account"}
          </button>

          <button
            type="button"
            disabled={isSaving || !resolvedAccount}
            onClick={() => {
              setMessage("");

              startSaving(async () => {
                const response = await fetch("/api/bank-details", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    bank_code: bankCode,
                    bank_account: accountNumber,
                  }),
                });

                const payload = await response.json();

                if (!response.ok) {
                  setMessage(payload.message || "Unable to save bank details.");
                  return;
                }

                setResolvedAccount(payload.data.account);
                setMessage("Bank details saved successfully.");
                router.push("/dashboard");
                router.refresh();
              });
            }}
            className="button-primary button-block-mobile disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save bank details"}
          </button>
        </div>

        {banks.length === 0 && resolvedAccount && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Bank list unavailable, but your account is verified
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Click "Save bank details" above to complete verification.
            </p>
          </div>
        )}

        <p className="text-sm text-slate-500">{message}</p>
      </form>

      {resolvedAccount ? (
        <div className="panel rise-in delay-2 p-6 float-card-alt sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Verified account
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Bank</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {resolvedAccount.bank_name || selectedBankName}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Account number</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {resolvedAccount.account_number}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Account name</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {resolvedAccount.account_name}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
