# Intellink Promo Code "BRYAN" Implementation - TODO

## Status: In Progress

### Step 1: ✅ Migration created: supabase/migrations/004_promo_codes.sql
- New table: promo_codes
- New table: user_promo_redemptions  
- ALTER users: ADD is_free_month, free_expires_at
- Seed 'BRYAN' with 20 uses

### Step 2: ✅ Updated Types (src/types/index.ts)
- Added User fields: is_free_month, free_expires_at

### Step 3: ✅ New API Route (src/app/api/promo/redeem/route.ts)
- POST: validate & redeem "BRYAN" atomically

### Step 4: ✅ Updated Register Page (src/app/register/page.tsx) 
- Added promo input + Apply button
- Calls /api/promo/redeem 
- Sends promo_code to register API if applied, redirects dashboard

### Step 5: ✅ Updated Register API (src/app/api/auth/register/route.ts)
- Handles promo_code:'BRYAN', calls redeem_promo RPC, sets free Pro month

### Step 6: ✅ Updated Subscription Logic
- /api/subscription/initialize: Bypasses payment if free month active
- lib/auth.ts: syncSubscriptionStatus handles free month expiry

### Step 7: ✅ Updated Dashboard (src/app/dashboard/page.tsx)
- Shows 'Free Pro Month' badge + countdown

### Step 8: Test & Cleanup
- Apply migration (`supabase db push`)
- Test register w/ BRYAN → free Pro month, dashboard
- Test 21st redemption → 'exhausted'
- Test 30d expiry → inactive

**Progress**: 7/8 ✅✅✅✅✅✅✅
**Next Action**: Step 8 - Apply migration & test.
