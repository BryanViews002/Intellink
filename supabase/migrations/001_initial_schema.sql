create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text unique not null,
  username text unique not null,
  bio text,
  profile_photo text,
  subscription_plan text check (subscription_plan in ('starter', 'pro')),
  subscription_status text not null default 'inactive' check (subscription_status in ('active', 'inactive')),
  subscription_expires_at timestamptz,
  korapay_customer_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.offerings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in ('qa', 'session', 'resource')),
  title text not null,
  description text not null,
  price numeric not null check (price > 0),
  file_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro')),
  amount numeric not null check (amount > 0),
  korapay_reference text unique not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  client_name text not null,
  expert_id uuid not null references public.users (id) on delete cascade,
  offering_id uuid not null references public.offerings (id) on delete cascade,
  offering_type text not null check (offering_type in ('qa', 'session', 'resource')),
  amount_paid numeric not null check (amount_paid > 0),
  korapay_reference text unique not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  question_text text not null,
  answer_text text,
  is_answered boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  scheduled_time timestamptz not null,
  meeting_link text,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  expert_id uuid not null references public.users (id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_username on public.users (username);
create index if not exists idx_users_subscription_status on public.users (subscription_status);
create index if not exists idx_offerings_user_id on public.offerings (user_id);
create index if not exists idx_transactions_expert_id on public.transactions (expert_id);
create index if not exists idx_transactions_reference on public.transactions (korapay_reference);
create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);
create index if not exists idx_subscriptions_reference on public.subscriptions (korapay_reference);
create index if not exists idx_questions_transaction_id on public.questions (transaction_id);
create index if not exists idx_sessions_transaction_id on public.sessions (transaction_id);

alter table public.users enable row level security;
alter table public.offerings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.transactions enable row level security;
alter table public.questions enable row level security;
alter table public.sessions enable row level security;
alter table public.ratings enable row level security;

drop policy if exists "Users are publicly viewable" on public.users;
create policy "Users are publicly viewable"
on public.users
for select
using (true);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
on public.users
for update
using (auth.uid() = id);

drop policy if exists "Users can view their own offerings and public active offerings" on public.offerings;
create policy "Users can view their own offerings and public active offerings"
on public.offerings
for select
using (is_active = true or auth.uid() = user_id);

drop policy if exists "Users can manage their own offerings" on public.offerings;
create policy "Users can manage their own offerings"
on public.offerings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
create policy "Users can view their own subscriptions"
on public.subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "Experts can view their own transactions" on public.transactions;
create policy "Experts can view their own transactions"
on public.transactions
for select
using (auth.uid() = expert_id);

drop policy if exists "Experts can view their own questions" on public.questions;
create policy "Experts can view their own questions"
on public.questions
for select
using (
  exists (
    select 1
    from public.transactions
    where public.transactions.id = public.questions.transaction_id
      and public.transactions.expert_id = auth.uid()
  )
);

drop policy if exists "Experts can update their own questions" on public.questions;
create policy "Experts can update their own questions"
on public.questions
for update
using (
  exists (
    select 1
    from public.transactions
    where public.transactions.id = public.questions.transaction_id
      and public.transactions.expert_id = auth.uid()
  )
);

drop policy if exists "Experts can view their own sessions" on public.sessions;
create policy "Experts can view their own sessions"
on public.sessions
for select
using (
  exists (
    select 1
    from public.transactions
    where public.transactions.id = public.sessions.transaction_id
      and public.transactions.expert_id = auth.uid()
  )
);

drop policy if exists "Ratings are publicly viewable" on public.ratings;
create policy "Ratings are publicly viewable"
on public.ratings
for select
using (true);

insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

drop policy if exists "Public can view profile images" on storage.objects;
create policy "Public can view profile images"
on storage.objects
for select
using (bucket_id = 'profiles');

drop policy if exists "Users can upload profile images" on storage.objects;
create policy "Users can upload profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profiles'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update profile images" on storage.objects;
create policy "Users can update profile images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profiles'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profiles'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can upload resource files" on storage.objects;
create policy "Users can upload resource files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'resources');
