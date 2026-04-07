import { CURRENCY_CODE } from "@/lib/constants";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: CURRENCY_CODE,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function calculateDaysRemaining(date: string | null) {
  if (!date) {
    return 0;
  }

  const now = Date.now();
  const expiry = new Date(date).getTime();
  const remaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  return Math.max(0, remaining);
}
