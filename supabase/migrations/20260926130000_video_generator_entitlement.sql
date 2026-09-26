-- Keep Video Generator access server-side and ready for credit enforcement.
-- The existing ai_features row defines the feature as CREDIT_BASED at 40 credits.

create index if not exists ai_features_code_active_idx
  on public.ai_features(feature_code, is_active);

