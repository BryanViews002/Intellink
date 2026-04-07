alter table public.users
  add column if not exists bank_code text,
  add column if not exists bank_account text,
  add column if not exists account_name text,
  add column if not exists korapay_recipient_verified boolean not null default false;

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.users (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  amount numeric not null check (amount > 0),
  korapay_reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_payouts_transaction_id
  on public.payouts (transaction_id);

create index if not exists idx_payouts_expert_id
  on public.payouts (expert_id);

alter table public.payouts enable row level security;

drop policy if exists "Experts can view their own payouts" on public.payouts;
create policy "Experts can view their own payouts"
on public.payouts
for select
using (auth.uid() = expert_id);
