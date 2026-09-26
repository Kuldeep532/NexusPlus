-- Heavy-user AI credit top-ups, subscription gated.
insert into public.credit_plans(plan_code,plan_name,credits_offered,price_inr,product_scope,is_active,tagline)
values
  ('credit_topup_1500','Credit Top-up 1,500',1500,799,'nexus_plus',true,'For frequent AI and video generation'),
  ('credit_topup_2000','Credit Top-up 2,000',2000,999,'nexus_plus',true,'For heavy monthly AI and video use'),
  ('credit_topup_5000','Credit Top-up 5,000',5000,1999,'nexus_plus',true,'For very heavy AI and video generation')
on conflict (plan_code) do update set
  plan_name=excluded.plan_name,
  credits_offered=excluded.credits_offered,
  price_inr=excluded.price_inr,
  product_scope=excluded.product_scope,
  is_active=true,
  tagline=excluded.tagline,
  updated_at=now();

alter table public.app_feature_flags
  add column if not exists ad_policy text not null default 'MAIN_FEATURES_ONLY';

update public.app_feature_flags
set ad_policy='MAIN_FEATURES_ONLY',updated_at=now();

update public.app_feature_flags
set ad_policy='NEVER'
where lower(feature_code) in (
  'spiritual','spiritual_tab','gita_nexus','gita_nexus_tab','bhagavad_gita'
);

create or replace function public.should_show_ads(p_feature_code text)
returns boolean
language sql
security definer
set search_path=public
as $$
select
  case
    when exists (
      select 1
      from public.user_subscriptions s
      where s.user_id=auth.uid()
        and s.status='ACTIVE'
        and s.expires_at>now()
    ) then false
    when lower(coalesce(p_feature_code,'')) in (
      'spiritual','spiritual_tab','gita_nexus','gita_nexus_tab','bhagavad_gita'
    ) then false
    else exists (
      select 1
      from public.app_feature_flags f
      where lower(f.feature_code)=lower(p_feature_code)
        and f.enabled=true
        and coalesce(f.ad_policy,'MAIN_FEATURES_ONLY')<>'NEVER'
    )
  end;
$$;

revoke all on function public.should_show_ads(text) from public;
grant execute on function public.should_show_ads(text) to authenticated;

update public.credit_plans
set is_active = plan_code in (
  'credit_topup_100','credit_topup_300','credit_topup_750',
  'credit_topup_1500','credit_topup_2000','credit_topup_5000'
),
updated_at=now();
