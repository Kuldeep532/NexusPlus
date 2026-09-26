-- Premium + AI credit consolidation.
-- Canonical product model:
-- 1) Three monthly memberships only.
-- 2) Each active membership grants a monthly credit allowance.
-- 3) Optional top-up credits remain available only while a subscription is active.
-- 4) No standalone credit plan can be purchased without an active subscription.

alter table public.subscription_plans
  add column if not exists included_credits integer not null default 0;

update public.subscription_plans
set
  plan_name = case tier_level
    when 1 then 'Lifeline'
    when 2 then 'Super'
    when 3 then 'Pro'
    else plan_name
  end,
  duration_days = 30,
  is_active = true,
  included_credits = case tier_level
    when 1 then 150
    when 2 then 500
    when 3 then 1400
    else included_credits
  end,
  description = case tier_level
    when 1 then 'Essential Nexus Plus membership with monthly AI credits and ad-free access.'
    when 2 then 'Expanded Nexus Plus membership with more monthly AI credits and premium tools.'
    when 3 then 'Full Nexus Plus membership with the highest monthly AI credit allowance and premium tools.'
    else description
  end;

-- Deactivate non-monthly/legacy plans while retaining historical payment records.
update public.subscription_plans
set is_active = false
where duration_days <> 30
   or plan_code not in ('lifeline_monthly','super_monthly','pro_monthly');

-- Keep one top-up catalog in the existing credit_plans table for backward compatibility,
-- but make it a subscription-gated top-up catalog rather than a standalone product.
insert into public.credit_plans (plan_name, credits_offered, price_inr, tagline, is_active)
values
  ('Credit Top-up 100', 100, 49.00, 'Add 100 credits while your Nexus Plus subscription is active.', true),
  ('Credit Top-up 300', 300, 99.00, 'Add 300 credits while your Nexus Plus subscription is active.', true),
  ('Credit Top-up 750', 750, 199.00, 'Add 750 credits while your Nexus Plus subscription is active.', true)
on conflict do nothing;

update public.credit_plans
set is_active = false
where plan_name not in ('Credit Top-up 100','Credit Top-up 300','Credit Top-up 750');

create table if not exists public.user_ai_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  monthly_allowance integer not null default 0 check (monthly_allowance >= 0),
  monthly_granted_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_ai_credits enable row level security;
drop policy if exists "users can read their own ai credits" on public.user_ai_credits;
create policy "users can read their own ai credits"
  on public.user_ai_credits for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.get_my_ai_credit_balance()
returns integer
language sql
security invoker
set search_path = public
as $$
  select coalesce((select balance from public.user_ai_credits where user_id = auth.uid()), 0);
$$;

revoke all on function public.get_my_ai_credit_balance() from public;
grant execute on function public.get_my_ai_credit_balance() to authenticated;

create or replace function public.can_purchase_credit_topup()
returns boolean
language sql
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.user_subscriptions s
    where s.user_id = auth.uid()
      and s.status = 'ACTIVE'
      and s.expires_at > now()
  );
$$;

revoke all on function public.can_purchase_credit_topup() from public;
grant execute on function public.can_purchase_credit_topup() to authenticated;

create or replace function public.grant_monthly_plan_credits(p_user_id uuid, p_plan_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  allowance integer;
  current_sub public.user_subscriptions;
begin
  select * into current_sub
  from public.user_subscriptions
  where user_id = p_user_id
    and status = 'ACTIVE'
    and expires_at > now()
    and plan_id = p_plan_id
  order by expires_at desc
  limit 1;

  if not found then
    raise exception 'ACTIVE_SUBSCRIPTION_REQUIRED';
  end if;

  select included_credits into allowance
  from public.subscription_plans
  where plan_id = p_plan_id and is_active = true;

  if allowance is null then raise exception 'PREMIUM_PLAN_NOT_FOUND'; end if;

  insert into public.user_ai_credits(user_id,balance,monthly_allowance,monthly_granted_at,updated_at)
  values(p_user_id,allowance,allowance,now(),now())
  on conflict(user_id) do update
    set balance = public.user_ai_credits.balance + allowance,
        monthly_allowance = allowance,
        monthly_granted_at = now(),
        updated_at = now();

  return allowance;
end;
$$;

revoke all on function public.grant_monthly_plan_credits(uuid,bigint) from public;

create or replace function public.create_ai_credit_topup(p_plan_code text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  topup public.credit_plans;
begin
  if not public.can_purchase_credit_topup() then
    raise exception 'ACTIVE_SUBSCRIPTION_REQUIRED';
  end if;

  select *
  into topup
  from public.credit_plans
  where plan_name = replace(replace(p_plan_code,'credit_topup_','Credit Top-up '),'_',' ')
    and is_active = true
  limit 1;

  if not found then
    raise exception 'CREDIT_TOPUP_NOT_FOUND';
  end if;

  return jsonb_build_object(
    'productType','AI_CREDIT_TOPUP',
    'planName', topup.plan_name,
    'credits', topup.credits_offered,
    'amountInr', topup.price_inr,
    'status','PENDING'
  );
end;
$$;

revoke all on function public.create_ai_credit_topup(text) from public;
grant execute on function public.create_ai_credit_topup(text) to authenticated;

