-- Canonical live economics and secure payment flow for Nexus Plus.
-- Keep customer-facing plans monthly; credit top-ups require an active subscription.

create or replace function public.create_payment_order(
  p_product_type text,
  p_plan_code text,
  p_payment_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id uuid;
  v_amount numeric;
  v_upi text;
  v_name text;
  v_provider text;
  v_label text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_product_type not in ('PREMIUM','AI_CREDITS') then raise exception 'INVALID_PRODUCT_TYPE'; end if;

  if p_product_type='PREMIUM' then
    select price_inr, plan_name into v_amount, v_label
    from public.subscription_plans
    where plan_code=p_plan_code and is_active=true;
  else
    if not public.can_purchase_credit_topup() then raise exception 'ACTIVE_SUBSCRIPTION_REQUIRED'; end if;
    select price_inr, plan_name into v_amount, v_label
    from public.credit_plans
    where plan_code=p_plan_code and is_active=true and plan_code like 'credit_topup_%';
  end if;

  if v_amount is null then raise exception 'PLAN_NOT_FOUND'; end if;

  select setting_value into v_upi from public.payment_settings where setting_key='upi_id' and is_active=true;
  select setting_value into v_name from public.payment_settings where setting_key='payment_receiver_name' and is_active=true;
  select setting_value into v_provider from public.payment_settings where setting_key='payment_provider' and is_active=true;
  if v_upi is null then raise exception 'PAYMENT_NOT_CONFIGURED'; end if;

  insert into public.payment_orders(
    user_id, product_type, plan_code, amount_inr, upi_id,
    payment_reference, provider, status
  ) values(
    auth.uid(), p_product_type, p_plan_code, v_amount, v_upi,
    p_payment_reference, coalesce(v_provider,'UPI_MANUAL'), 'PENDING'
  ) returning order_id into v_id;

  return jsonb_build_object(
    'orderId',v_id,
    'amountInr',v_amount,
    'planCode',p_plan_code,
    'planName',v_label,
    'upiId',v_upi,
    'receiverName',coalesce(v_name,'Nexus Plus'),
    'provider',coalesce(v_provider,'UPI_MANUAL'),
    'status','PENDING'
  );
end;
$function$;

create or replace function public.admin_verify_payment(
  p_order_id uuid,
  p_approved boolean,
  p_payment_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  o public.payment_orders%rowtype;
  sp public.subscription_plans%rowtype;
  cp public.credit_plans%rowtype;
  v_start timestamptz;
  v_expiry timestamptz;
  v_existing_expiry timestamptz;
begin
  if not public.is_admin_user() then raise exception 'ADMIN_REQUIRED'; end if;
  select * into o from public.payment_orders where order_id=p_order_id for update;
  if o.order_id is null then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status='PAID' then
    return jsonb_build_object('orderId',o.order_id,'status','PAID','productType',o.product_type,'planCode',o.plan_code);
  end if;

  if not p_approved then
    update public.payment_orders
    set status='REJECTED',
        payment_reference=coalesce(p_payment_reference,payment_reference),
        verified_at=now(), verified_by=auth.uid(),
        failure_reason='Payment was rejected by an administrator'
    where order_id=o.order_id;
    return jsonb_build_object('orderId',o.order_id,'status','REJECTED');
  end if;

  if o.product_type='PREMIUM' then
    select * into sp from public.subscription_plans
    where plan_code=o.plan_code and is_active=true;
    if sp.plan_id is null then raise exception 'PLAN_NOT_FOUND'; end if;

    select expires_at into v_existing_expiry
    from public.user_subscriptions
    where user_id=o.user_id and status='ACTIVE' and expires_at>now()
    order by expires_at desc limit 1;

    v_start := coalesce(v_existing_expiry,now());
    v_expiry := v_start + make_interval(days=>sp.duration_days);

    insert into public.user_subscriptions(
      user_id,plan_id,status,starts_at,expires_at,gateway,gateway_subscription_id,auto_pay_enabled
    ) values(
      o.user_id,sp.plan_id,'ACTIVE',v_start,v_expiry,'UPI_MANUAL',o.order_id::text,false
    );

    insert into public.user_ai_credits(
      user_id,balance,lifetime_purchased,lifetime_used,updated_at
    ) values(
      o.user_id,sp.included_credits,sp.included_credits,0,now()
    )
    on conflict(user_id) do update set
      balance=public.user_ai_credits.balance+excluded.balance,
      lifetime_purchased=public.user_ai_credits.lifetime_purchased+excluded.lifetime_purchased,
      updated_at=now();

    insert into public.ai_credit_transactions(
      user_id,credit_plan_id,delta,reason,reference_id,metadata
    ) values(
      o.user_id,null,sp.included_credits,'MONTHLY_PLAN_INCLUDED',o.order_id::text,
      jsonb_build_object('planCode',sp.plan_code,'planTier',sp.tier_level)
    );

    update public.profiles
    set is_premium=true,
        premium_until=greatest(coalesce(premium_until,'epoch'::timestamptz),v_expiry),
        role=case when role='admin'::app_role then role else 'premium'::app_role end,
        updated_at=now()
    where user_id=o.user_id;

  else
    if not exists(
      select 1 from public.user_subscriptions
      where user_id=o.user_id and status='ACTIVE' and expires_at>now()
    ) then
      raise exception 'ACTIVE_SUBSCRIPTION_REQUIRED';
    end if;

    select * into cp from public.credit_plans
    where plan_code=o.plan_code and is_active=true and plan_code like 'credit_topup_%';
    if cp.credit_plan_id is null then raise exception 'PLAN_NOT_FOUND'; end if;

    insert into public.user_ai_credits(
      user_id,balance,lifetime_purchased,lifetime_used,updated_at
    ) values(o.user_id,cp.credits_offered,cp.credits_offered,0,now())
    on conflict(user_id) do update set
      balance=public.user_ai_credits.balance+excluded.balance,
      lifetime_purchased=public.user_ai_credits.lifetime_purchased+excluded.lifetime_purchased,
      updated_at=now();

    insert into public.ai_credit_transactions(
      user_id,credit_plan_id,delta,reason,reference_id,metadata
    ) values(
      o.user_id,cp.credit_plan_id,cp.credits_offered,'AI_CREDIT_TOPUP',o.order_id::text,
      jsonb_build_object('topupPlan',cp.plan_code)
    );
  end if;

  update public.payment_orders
  set status='PAID',
      payment_reference=coalesce(p_payment_reference,payment_reference),
      paid_at=now(), verified_at=now(), verified_by=auth.uid(),
      failure_reason=null
  where order_id=o.order_id;

  return jsonb_build_object(
    'orderId',o.order_id,'status','PAID',
    'productType',o.product_type,'planCode',o.plan_code
  );
end;
$function$;

update public.subscription_plans set
  price_inr = case plan_code
    when 'lifeline_monthly' then 99
    when 'super_monthly' then 249
    when 'pro_monthly' then 599
    else price_inr end,
  included_credits = case plan_code
    when 'lifeline_monthly' then 150
    when 'super_monthly' then 500
    when 'pro_monthly' then 1400
    else included_credits end,
  duration_days=30,
  is_active = (plan_code in ('lifeline_monthly','super_monthly','pro_monthly')),
  updated_at=now();

update public.credit_plans set
  price_inr = case plan_code
    when 'credit_topup_100' then 79
    when 'credit_topup_300' then 199
    when 'credit_topup_750' then 449
    else price_inr end,
  credits_offered = case plan_code
    when 'credit_topup_100' then 100
    when 'credit_topup_300' then 300
    when 'credit_topup_750' then 750
    else credits_offered end,
  is_active=(plan_code in ('credit_topup_100','credit_topup_300','credit_topup_750')),
  updated_at=now();

update public.ai_features set credit_cost=case feature_code
  when 'nexus_ai_gemini' then 1
  when 'nexus_assistant_gemini' then 1
  when 'nexus_ai_openai' then 4
  when 'nexus_assistant_openai' then 4
  when 'nexus_ai_anthropic' then 5
  when 'nexus_assistant_anthropic' then 5
  when 'elevenlabs_tts' then 40
  when 'video_generator' then 100
  when 'ai_heavy_generation' then 25
  when 'music_generator' then 30
  when 'vocal_remover' then 15
  when 'nexus_ai_chat' then 1
  else credit_cost end,
  updated_at=now()
where is_active=true;

update public.premium_feature_catalog set credit_cost=case feature_code
  when 'nexus_ai_gemini' then 1
  when 'nexus_assistant_gemini' then 1
  when 'nexus_ai_openai' then 4
  when 'nexus_assistant_openai' then 4
  when 'nexus_ai_anthropic' then 5
  when 'nexus_assistant_anthropic' then 5
  when 'elevenlabs_tts' then 40
  when 'video_generator' then 100
  when 'ai_heavy_generation' then 25
  when 'music_generator' then 30
  when 'vocal_remover' then 15
  else credit_cost end,
  updated_at=now();
