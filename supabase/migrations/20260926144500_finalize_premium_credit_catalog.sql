-- Finalize the monthly Premium + subscription-gated top-up catalog.
-- Only these three monthly plans are customer-visible.

alter table public.subscription_plans
  add column if not exists included_credits integer not null default 0;

insert into public.subscription_plans
  (plan_code, plan_name, tier_level, description, price_inr, duration_days, blocks_ads, unlocks_premium_features, is_auto_pay_supported, included_credits, is_active)
select
  v.plan_code,
  v.plan_name,
  v.tier_level,
  v.description,
  v.price_inr,
  30,
  true,
  true,
  true,
  v.included_credits,
  true
from (
  values
    ('lifeline_monthly','Lifeline',1,'Essential Nexus Plus membership with monthly AI credits and ad-free access.',99.00,150),
    ('super_monthly','Super',2,'Expanded Nexus Plus membership with more monthly AI credits and premium tools.',249.00,500),
    ('pro_monthly','Pro',3,'Full Nexus Plus membership with the highest monthly AI credit allowance and premium tools.',599.00,1400)
) as v(plan_code,plan_name,tier_level,description,price_inr,included_credits)
on conflict (plan_code) do update
set
  plan_name = excluded.plan_name,
  tier_level = excluded.tier_level,
  description = excluded.description,
  price_inr = excluded.price_inr,
  duration_days = 30,
  blocks_ads = true,
  unlocks_premium_features = true,
  is_auto_pay_supported = true,
  included_credits = excluded.included_credits,
  is_active = true,
  updated_at = now();

update public.subscription_plans
set is_active = false
where plan_code not in ('lifeline_monthly','super_monthly','pro_monthly');

update public.credit_plans
set is_active = false
where plan_name in ('Starter Credits','Creator Credits','Studio Credits');

insert into public.credit_plans(plan_name,credits_offered,price_inr,tagline,is_active)
select * from (
  values
    ('Credit Top-up 100',100,79.00,'Add 100 credits while your Nexus Plus subscription is active.',true),
    ('Credit Top-up 300',300,199.00,'Add 300 credits while your Nexus Plus subscription is active.',true),
    ('Credit Top-up 750',750,449.00,'Add 750 credits while your Nexus Plus subscription is active.',true)
) as v(plan_name,credits_offered,price_inr,tagline,is_active)
where not exists (
  select 1 from public.credit_plans p where p.plan_name = v.plan_name
);

update public.credit_plans
set is_active = (plan_name in ('Credit Top-up 100','Credit Top-up 300','Credit Top-up 750'));

-- Canonical AI feature costs. These are server-side source-of-truth values.
insert into public.ai_features(feature_code,feature_name,access_type,credit_cost,is_active)
values
  ('nexus_assistant_gemini','Nexus Assistant • Gemini','CREDIT_BASED',1,true),
  ('nexus_assistant_openai','Nexus Assistant • OpenAI','CREDIT_BASED',4,true),
  ('nexus_assistant_anthropic','Nexus Assistant • Claude','CREDIT_BASED',5,true),
  ('elevenlabs_tts','ElevenLabs Text to Speech','CREDIT_BASED',40,true),
  ('music_generator','Music Generator','CREDIT_BASED',30,true),
  ('video_generator','Video Generator','CREDIT_BASED',100,true),
  ('vocal_remover','Vocal Remover','CREDIT_BASED',15,true)
on conflict(feature_code) do update
set
  feature_name = excluded.feature_name,
  access_type = excluded.access_type,
  credit_cost = excluded.credit_cost,
  is_active = true,
  updated_at = now();

-- Make top-up creation fail closed unless the user has an active subscription.
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
  where lower(replace(plan_name,' ','_')) = lower(p_plan_code)
    and is_active = true
  limit 1;

  if not found then
    raise exception 'CREDIT_TOPUP_NOT_FOUND';
  end if;

  return jsonb_build_object(
    'productType','AI_CREDIT_TOPUP',
    'planCode',p_plan_code,
    'planName',topup.plan_name,
    'credits',topup.credits_offered,
    'amountInr',topup.price_inr,
    'status','PENDING'
  );
end;
$$;

revoke all on function public.create_ai_credit_topup(text) from public;
grant execute on function public.create_ai_credit_topup(text) to authenticated;
