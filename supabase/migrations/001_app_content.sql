-- Nexus Plus content control plane.
-- Only public, non-sensitive content is readable with the publishable/anon key.
-- Never store passwords, private keys, pairing secrets, biometric data or remote-control credentials here.

create table if not exists public.app_content (
  feature_id text not null,
  content_key text not null,
  locale text not null default 'en',
  value jsonb not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (feature_id, content_key, locale)
);

create table if not exists public.remote_agent_releases (
  platform text not null check (platform in ('windows', 'macos', 'ubuntu')),
  version text not null,
  download_url text not null,
  sha256 text,
  release_notes text,
  enabled boolean not null default true,
  published_at timestamptz not null default now(),
  primary key (platform, version)
);

alter table public.app_content enable row level security;
alter table public.remote_agent_releases enable row level security;

drop policy if exists "public can read enabled app content" on public.app_content;
create policy "public can read enabled app content" on public.app_content for select using (enabled = true);

drop policy if exists "public can read enabled agent releases" on public.remote_agent_releases;
create policy "public can read enabled agent releases" on public.remote_agent_releases for select using (enabled = true);

-- The Android client receives no write policy. Publishing is dashboard/server-only.

insert into public.app_content(feature_id, content_key, locale, value)
values
  ('home', 'remote-computer', 'en', jsonb_build_object('title','Computer Control','subtitle','Securely control your Windows, Ubuntu, or macOS computer from your phone.','route','/remote-computer','icon','remote-desktop','order',40)),
  ('privacy', 'remote-computer', 'en', jsonb_build_object('title','Computer Control','body','Computer Control uses secure pairing, device-bound cryptographic authorization, and phone authentication for protected actions. Remote commands are not arbitrary shell commands. Screen, microphone, clipboard, and accessibility data are transferred only when the user explicitly enables the relevant feature and the paired agent accepts the request.')),
  ('privacy', 'payment-announcer', 'en', jsonb_build_object('title','Voice Payment Announcer','body','Payment announcement data is processed only to provide the enabled notification feature. The app does not sell payment information.')),
  ('privacy', 'expense-tracker', 'en', jsonb_build_object('title','Expense Tracker','body','Expense records are user-provided content. They are not shared with the remote computer agent unless a future feature explicitly requests and authorizes such transfer.')),
  ('privacy', 'geeta-nexus', 'en', jsonb_build_object('title','Geeta Nexus','body','Bhagavad Gita content and reading preferences are processed to provide the requested reading and accessibility experience.')),
  ('privacy', 'book-reader', 'en', jsonb_build_object('title','Book Reader','body','Books and reading state are processed to provide document reading, navigation and accessibility features.')),
  ('privacy', 'media-player', 'en', jsonb_build_object('title','Media Player','body','Media and playback state are processed to provide audio/video playback and continuity features.')),
  ('privacy', 'utility-tools', 'en', jsonb_build_object('title','Utility Tools','body','Utility, PDF, time, radio and voice tools process only the files, text, audio or settings needed for the requested operation.'))
on conflict (feature_id, content_key, locale) do update
set value = excluded.value, enabled = true, updated_at = now();
