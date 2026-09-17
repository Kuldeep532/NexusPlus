-- Nexus Plus Premium + Credits foundation.
-- Supabase is the source of truth for access and entitlement state.
-- Payment gateway callbacks/webhooks should write user_subscriptions server-side.

create table if not exists public.ai_features (
  feature_id bigserial primary key,
  feature_code text unique not null,
  feature_name text not null,
  access_type text check (access_type in ('FREE', 'CREDIT_BASED', 'PREMIUM_ONLY')) not null,
  credit_cost integer not null default 0 check (credit_cost >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_features_credit_cost_check
    check ((access_type = 'CREDIT_BASED' and credit_cost > 0) or (access_type <> 'CREDIT_BASED' and credit_cost = 0))
);

create table if not exists public.subscription_plans (
  plan_id bigserial primary key,
  plan_name text not null,
  tier_level integer not null check (tier_level between 1 and 3),
  description text,
  price_inr numeric(10,2) not null check (price_inr >= 0),
  duration_days integer not null check (duration_days > 0),
  blocks_ads boolean not null default true,
  unlocks_premium_features boolean not null default false,
  is_auto_pay_supported boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tier_level)
);

create table if not exists public.credit_plans (
  credit_plan_id bigserial primary key,
  plan_name text not null,
  credits_offered integer not null check (credits_offered > 0),
  price_inr numeric(10,2) not null check (price_inr >= 0),
  tagline text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  subscription_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id bigint not null references public.subscription_plans(plan_id),
  auto_pay_enabled boolean not null default false,
  gateway_mandate_id text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_dates_check check (expires_at > starts_at)
);

create index if not exists user_subscriptions_user_idx on public.user_subscriptions(user_id, status, expires_at desc);
create index if not exists ai_features_access_idx on public.ai_features(access_type, is_active);
create index if not exists subscription_plans_active_idx on public.subscription_plans(is_active, tier_level);
create index if not exists credit_plans_active_idx on public.credit_plans(is_active, credits_offered);

alter table public.ai_features enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.credit_plans enable row level security;
alter table public.user_subscriptions enable row level security;

drop policy if exists "active ai features are readable" on public.ai_features;
create policy "active ai features are readable"
  on public.ai_features for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "active subscription plans are readable" on public.subscription_plans;
create policy "active subscription plans are readable"
  on public.subscription_plans for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "active credit plans are readable" on public.credit_plans;
create policy "active credit plans are readable"
  on public.credit_plans for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "users can read their subscriptions" on public.user_subscriptions;
create policy "users can read their subscriptions"
  on public.user_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

-- Seed the membership catalog used by the first Buy Premium screen.
insert into public.subscription_plans
  (plan_name, tier_level, description, price_inr, duration_days, blocks_ads, unlocks_premium_features, is_auto_pay_supported)
values
  ('Lifeline', 1, 'Ad-free Nexus Plus with a lighter membership layer.', 49.00, 30, true, false, true),
  ('Super', 2, 'Premium toolkit access for everyday creators and power users.', 149.00, 30, true, true, true),
  ('Pro', 3, 'Full Premium access for intensive media and AI workflows.', 399.00, 30, true, true, true)
on conflict (tier_level) do update set
  plan_name = excluded.plan_name,
  description = excluded.description,
  price_inr = excluded.price_inr,
  duration_days = excluded.duration_days,
  blocks_ads = excluded.blocks_ads,
  unlocks_premium_features = excluded.unlocks_premium_features,
  is_auto_pay_supported = excluded.is_auto_pay_supported,
  is_active = true,
  updated_at = now();

-- Keep example AI access classification separate from subscription entitlement.
insert into public.ai_features (feature_code, feature_name, access_type, credit_cost)
values
  ('vocal_remover', 'Vocal Remover', 'CREDIT_BASED', 10),
  ('music_generator', 'Music Generator', 'CREDIT_BASED', 25),
  ('video_generator', 'Video Generator', 'CREDIT_BASED', 40)
on conflict (feature_code) do update set
  feature_name = excluded.feature_name,
  access_type = excluded.access_type,
  credit_cost = excluded.credit_cost,
  is_active = true,
  updated_at = now();

-- Example credit catalog. These are intentionally separate from membership plans.
insert into public.credit_plans (plan_name, credits_offered, price_inr, tagline)
values
  ('Starter Credits', 50, 49.00, 'For occasional AI use'),
  ('Creator Credits', 150, 99.00, 'More AI work for less per credit'),
  ('Studio Credits', 500, 249.00, 'For frequent AI creation')
on conflict do nothing;
