# Intellink - Subscription Model Development Guidelines

## Project Overview
- **Business Model**: Experts pay monthly subscriptions to access the platform
- **Subscription Plans**:
  - Starter: ₦3,500/month (1 offering type only)
  - Pro: ₦7,000/month (all 3 types: Q&A, Session, Resource)
- **Key Rule**: Subscription must be ACTIVE to use platform
  - Inactive subscription = profile hidden, offerings disabled

## Tech Stack
- Next.js 14 (app router)
- Tailwind CSS
- Supabase (auth + database + storage)
- Korapay (subscription payments)
- Resend (email notifications)
- Vercel (deployment)

## Key Files & Structure
```
src/
  app/              → Next.js 14 routes
  lib/              → Utilities (supabase.ts, korapay.ts, auth.ts, email.ts)
  components/       → Reusable UI components
  types/            → TypeScript interfaces
```

## Critical Business Logic

### Subscription Flow
1. User registers → account created with `subscription_status = 'inactive'`
2. Redirected to /pricing to pick plan
3. Choose plan → Korapay payment initialized
4. Payment success → subscription_status = 'active', plan set, expiry = now + 30 days
5. On every login: check expiry, if expired → status = 'inactive', redirect to /pricing

### Plan Restrictions
- **Starter**: Can create only 1 offering type total
- **Pro**: Can create any/all 3 types (Q&A, Session, Resource)

### Profile Visibility
- **Active subscription**: Profile visible, offerings purchasable
- **Inactive subscription**: Profile shows "Currently unavailable", no pay buttons

## Database Schema
See `supabase/migrations/001_initial_schema.sql` for full schema.

Key tables:
- `users`: Expert profiles + subscription status
- `subscriptions`: Monthly subscription records
- `offerings`: Q&A/Session/Resource offerings
- `transactions`: Client purchases from experts
- `questions`, `sessions`, `ratings`: Related data

## Workflow Rules
1. Always check subscription status before allowing dashboard access
2. Always verify Korapay signature (HMAC SHA256) on webhook
3. Use `reference` prefix to route webhooks: `SUB_*` for subscriptions, `INTLNK_*` for client payments
4. All email notifications via Resend
5. Profile photo and resource files stored in Supabase Storage

## Styling
- Colors: Deep navy (#1a365d), white, gold (#d4af37)
- Font: Inter (Google Fonts)
- Use Tailwind utilities, no custom CSS
- Fully responsive (mobile-first)

## Next.js App Router
- Pages: `src/app/[route]/page.tsx`
- API routes: `src/app/api/*/route.ts`
- Dynamic routes: `src/app/[username]/page.tsx`
- Use layouts for shared UI

## Never
- Skip subscription status check
- Ignore Korapay signature verification
- Mix subscription and transaction payments (different logic)
- Commit without user approval
- Add features beyond requirements
