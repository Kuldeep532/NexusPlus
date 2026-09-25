-- Nexus Plus remote feature controls.
-- Source of truth for feature enable/disable and minimum membership tier.

create table if not exists public.app_feature_flags (
  feature_code text primary key,
  feature_name text not null,
  enabled boolean not null default true,
  min_tier integer not null default 1 check (min_tier between 1 and 3),
  message_when_disabled text,
  updated_at timestamptz not null default now()
);

alter table public.app_feature_flags enable row level security;

drop policy if exists "active feature flags are readable" on public.app_feature_flags;
create policy "active feature flags are readable"
  on public.app_feature_flags for select
  to anon, authenticated
  using (true);

insert into public.app_feature_flags
  (feature_code, feature_name, enabled, min_tier, message_when_disabled)
values
  ('nexus_discover', 'Nexus Discover', true, 1, 'Nexus Discover is temporarily unavailable. Please try again later.'),
  ('nexus_assist', 'Nexus Assist', true, 1, 'Nexus Assist is temporarily unavailable. Please try again later.'),
  ('audio_editor', 'Audio Editor', true, 1, 'Audio Editor is temporarily unavailable. Please try again later.'),
  ('voice_studio', 'Voice Studio', true, 2, 'Voice Studio is available with a higher membership plan.'),
  ('pdf_tools', 'PDF Tools', true, 1, 'PDF tools are temporarily unavailable. Please try again later.'),
  ('secure_vault', 'Secure Vault', true, 1, 'Secure Vault is temporarily unavailable. Please try again later.'),
  ('cctv', 'CCTV', true, 2, 'CCTV features are available with a higher membership plan.'),
  ('file_transfer', 'Send File', true, 1, 'File transfer is temporarily unavailable. Please try again later.')
on conflict (feature_code) do update set
  feature_name = excluded.feature_name,
  min_tier = excluded.min_tier,
  message_when_disabled = excluded.message_when_disabled,
  updated_at = now();

grant select on public.app_feature_flags to anon, authenticated;
