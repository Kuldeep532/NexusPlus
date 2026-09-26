-- Keep the six active heavy-user top-ups canonical.
-- Keep the three base monthly memberships plus three higher-credit bundle memberships.

update public.credit_plans
set is_active = plan_code in (
  'credit_topup_100','credit_topup_300','credit_topup_750',
  'credit_topup_1500','credit_topup_2000','credit_topup_5000'
),
updated_at=now();

update public.subscription_credit_bundles
set is_active = bundle_code in (
  'creator_monthly','studio_monthly','creator_max_monthly'
),
updated_at=now();

-- Provider-aligned internal credit costs.
update public.ai_features
set credit_cost = case feature_code
  when 'nexus_ai_gemini' then 1
  when 'nexus_assistant_gemini' then 1
  when 'nexus_ai_openai' then 4
  when 'nexus_assistant_openai' then 4
  when 'nexus_ai_anthropic' then 5
  when 'nexus_assistant_anthropic' then 5
  when 'elevenlabs_tts' then 40
  when 'video_generator' then 100
  when 'music_generator' then 30
  when 'vocal_remover' then 15
  when 'ai_heavy_generation' then 25
  when 'nexus_ai_chat' then 1
  else credit_cost
end,
updated_at=now()
where is_active=true;
