# Supabase Setup Guide for Intellink

## Step 1: Create Supabase Project

1. Go to https://supabase.com/
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project name**: `intellink`
   - **Database password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., us-east-1 for US)
5. Wait for project to initialize (~5 minutes)

## Step 2: Get API Keys

Once project is ready:

1. Go to **Settings** → **API**
2. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` → Copy "Project URL"
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Copy "anon public" key
   - `SUPABASE_SERVICE_ROLE_KEY` → Copy "service_role" secret key

Example `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste in the SQL editor
5. Click **Run** (or Cmd+Enter)
6. Wait for all queries to execute ✓

## What Gets Created

The SQL creates 7 tables:

- `users` - Expert profiles
- `offerings` - Expert services (Q&A, Sessions, Resources)
- `transactions` - Payment records
- `questions` - Q&A content
- `sessions` - Booked sessions
- `withdrawals` - Payout requests
- `ratings` - Expert reviews

Plus:

- 11 performance indexes
- Row Level Security (RLS) policies for data protection

## Step 4: Test Connection

After setting up:

1. Run `npm run dev` in the Intellink folder
2. Open browser to `http://localhost:3000`
3. If no errors → Connection works! ✓

## Troubleshooting

**"No valid key found"** - Check that `.env.local` keys are copied correctly (no extra spaces)

**"Failed to connect"** - Ensure your Supabase project is "Active" (green status in dashboard)

**RLS permission errors** - After creating tables, go to **Authentication** → **Policies** to verify RLS is enabled on all tables

## Next: Environment Setup

Once Supabase is ready, I'll proceed to Step 4: Create auth API routes for registration & login.
