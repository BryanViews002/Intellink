alter table public.users
  add column if not exists trust_status text not null default 'good' check (trust_status in ('good', 'restricted')),
  add column if not exists trust_flagged_at timestamptz,
  add column if not exists trust_reason text;

create unique index if not exists idx_ratings_transaction_id
  on public.ratings (transaction_id);

create index if not exists idx_ratings_expert_created_at
  on public.ratings (expert_id, created_at desc);

create index if not exists idx_ratings_expert_stars_created_at
  on public.ratings (expert_id, stars, created_at desc);
