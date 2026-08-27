create table if not exists public.remote_config (
  key text primary key,
  kind text not null check (kind in ('top_banner', 'dialog', 'feature_flag', 'content')),
  enabled boolean not null default true,
  title text,
  message text,
  action_label text,
  action_url text,
  payload jsonb not null default '{}'::jsonb,
  priority integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists remote_config_active_idx
  on public.remote_config (enabled, priority desc, updated_at desc);

alter table public.remote_config enable row level security;

drop policy if exists "public can read active remote config" on public.remote_config;
create policy "public can read active remote config"
  on public.remote_config
  for select
  to anon, authenticated
  using (
    enabled = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios', 'web')),
  app_version text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "users can manage their push tokens" on public.push_tokens;
create policy "users can manage their push tokens"
  on public.push_tokens
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_push_token_owner()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists push_tokens_set_owner on public.push_tokens;
create trigger push_tokens_set_owner
before insert or update on public.push_tokens
for each row execute function public.set_push_token_owner();

insert into public.remote_config (key, kind, enabled, title, message, payload, priority)
values (
  'home_top_banner',
  'top_banner',
  false,
  'Nexus Plus',
  'Remote message placeholder',
  '{"value":null}'::jsonb,
  0
)
on conflict (key) do nothing;
