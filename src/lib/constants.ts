import { type OfferingType, type SubscriptionPlan } from "@/types";

export const APP_NAME = "Intellink";
export const CURRENCY_CODE = "NGN";
export const CURRENCY_SYMBOL = "NGN";

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  {
    id: SubscriptionPlan;
    name: string;
    price: number;
    durationDays: number;
    tagline: string;
    description: string;
    offeringTypesAllowed: OfferingType[];
    featured?: boolean;
  }
> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 2500,
    durationDays: 30,
    tagline: "Start with one clear offer",
    description:
      "Best for experts launching a single paid service with a clean, premium profile.",
    offeringTypesAllowed: ["qa"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 4000,
    durationDays: 30,
    tagline: "Unlock the full earning stack",
    description:
      "Create Q&A, live sessions, and downloadable resources from one premium profile.",
    offeringTypesAllowed: ["qa", "session", "resource"],
    featured: true,
  },
};

export const OFFERING_TYPE_OPTIONS: Record<
  OfferingType,
  {
    id: OfferingType;
    name: string;
    shortName: string;
    clientPrompt: string;
    description: string;
  }
> = {
  qa: {
    id: "qa",
    name: "Private Q&A",
    shortName: "Q&A",
    clientPrompt: "Ask your question",
    description: "Clients pay to send a specific question and receive an answer.",
  },
  session: {
    id: "session",
    name: "1:1 Session",
    shortName: "Session",
    clientPrompt: "Choose a preferred time",
    description: "Clients book a session request and coordinate the final meeting link.",
  },
  resource: {
    id: "resource",
    name: "Digital Resource",
    shortName: "Resource",
    clientPrompt: "Instant access after payment",
    description: "Clients purchase a file or resource delivered by email.",
  },
};

export const SUBSCRIPTION_BADGE_COPY = {
  active: "Active subscription",
  inactive: "Inactive subscription",
};
