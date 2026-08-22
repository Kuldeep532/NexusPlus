create extension if not exists "pgcrypto";

create type if not exists public.app_role as enum ('admin', 'premium', 'normal');
create type if not exists public.payment_status as enum ('pending', 'completed', 'failed');

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'normal',
  device_hash text unique,
  is_premium boolean not null default false,
  premium_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_account_bindings (
  device_hash text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  bound_at timestamptz not null default now(),
  deletion_requested_at timestamptz,
  reusable_after timestamptz,
  blocked_at timestamptz,
  blocked_reason text,
  last_integrity_verdict text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_device_bindings_user on public.device_account_bindings(user_id);

alter table public.profiles enable row level security;
alter table public.device_account_bindings enable row level security;

revoke all on public.device_account_bindings from anon, authenticated;

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles for select
using (auth.uid() = user_id or public.current_user_is_admin());

drop policy if exists profiles_update_own_safe on public.profiles;
create policy profiles_update_own_safe
on public.profiles for update
using (auth.uid() = user_id or public.current_user_is_admin())
with check (
  auth.uid() = user_id or public.current_user_is_admin()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.claim_device_for_user(
  p_device_hash text,
  p_integrity_verdict text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_user uuid;
  v_binding record;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication is required.';
  end if;

  if p_device_hash is null or length(trim(p_device_hash)) < 32 then
    raise exception using errcode = '22023', message = 'A valid device security identifier is required.';
  end if;

  if p_integrity_verdict is null or length(trim(p_integrity_verdict)) < 3 then
    raise exception using errcode = '22023', message = 'Device integrity verification is required.';
  end if;

  select user_id into v_existing_user
  from public.device_account_bindings
  where device_hash = p_device_hash;

  if v_existing_user is not null and v_existing_user <> v_user_id then
    raise exception using errcode = '23505', message = 'This device is already linked to another account.';
  end if;

  select * into v_binding
  from public.device_account_bindings
  where user_id = v_user_id;

  if v_binding.user_id is not null and v_binding.device_hash <> p_device_hash then
    raise exception using errcode = '23505', message = 'This account is already linked to another device.';
  end if;

  if v_binding.blocked_at is not null then
    raise exception using errcode = '42501', message = 'This account or device is blocked.';
  end if;

  if v_binding.reusable_after is not null and v_binding.reusable_after > now() then
    raise exception using errcode = '42501', message = 'This account is in the mandatory deletion cooldown period.';
  end if;

  insert into public.device_account_bindings (
    device_hash,
    user_id,
    last_integrity_verdict,
    updated_at
  ) values (
    p_device_hash,
    v_user_id,
    p_integrity_verdict,
    now()
  )
  on conflict (device_hash) do update set
    last_integrity_verdict = excluded.last_integrity_verdict,
    updated_at = now();

  update public.profiles
  set device_hash = p_device_hash,
      updated_at = now()
  where user_id = v_user_id;

  return jsonb_build_object('ok', true, 'user_id', v_user_id);
end;
$$;

revoke all on function public.claim_device_for_user(text, text) from public, anon;
grant execute on function public.claim_device_for_user(text, text) to authenticated;
