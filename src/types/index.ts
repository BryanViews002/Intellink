export type SubscriptionPlan = "starter" | "pro";
export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "expired"
  | "cancelled"
  | "pending";

export type OfferingType = "qa" | "session" | "resource";
export type TransactionStatus = "pending" | "success" | "failed";
export type PayoutStatus = "pending" | "success" | "failed";
export type ExpertTrustStatus = "good" | "restricted";

export type TransactionContext = {
  questionText?: string;
  preferredTime?: string;
  reviewToken?: string;
};

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  bio: string | null;
  profile_photo: string | null;
  subscription_plan: SubscriptionPlan | null;
  subscription_status: "active" | "inactive";
  subscription_expires_at: string | null;
  korapay_customer_code: string | null;
  bank_code: string | null;
  bank_account: string | null;
  account_name: string | null;
  korapay_recipient_verified: boolean;
  trust_status: ExpertTrustStatus;
  trust_flagged_at: string | null;
  trust_reason: string | null;
  created_at: string;
}

export interface Offering {
  id: string;
  user_id: string;
  type: OfferingType;
  title: string;
  description: string;
  price: number;
  file_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  amount: number;
  korapay_reference: string;
  status: SubscriptionStatus;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  client_email: string;
  client_name: string;
  expert_id: string;
  offering_id: string;
  offering_type: OfferingType;
  amount_paid: number;
  korapay_reference: string;
  status: TransactionStatus;
  metadata: TransactionContext | null;
  created_at: string;
}

export interface Question {
  id: string;
  transaction_id: string;
  question_text: string;
  answer_text: string | null;
  is_answered: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  transaction_id: string;
  scheduled_time: string;
  meeting_link: string | null;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  created_at: string;
}

export interface Rating {
  id: string;
  transaction_id: string;
  expert_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface ExpertReviewSummary {
  averageStars: number;
  totalReviews: number;
  oneStarReviewsThisWeek: number;
}

export interface ExpertReview {
  id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  client_name: string;
  offering_title: string;
  offering_type: OfferingType;
}

export interface Payout {
  id: string;
  expert_id: string;
  transaction_id: string;
  amount: number;
  korapay_reference: string;
  status: PayoutStatus;
  created_at: string;
}

export interface NigerianBank {
  name: string;
  slug: string;
  code: string;
  country: string;
}

export interface MarketplaceExpert {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  profile_photo: string | null;
}

export interface MarketplaceListing {
  id: string;
  type: OfferingType;
  title: string;
  description: string;
  price: number;
  created_at: string;
  expert: MarketplaceExpert;
}
