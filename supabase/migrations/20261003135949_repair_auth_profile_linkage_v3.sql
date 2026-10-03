-- Keeps the deployed auth/profile repair reproducible from the repository.
-- This migration matches the Supabase migration already applied to project cpbwiarqlvtlnwbkmpws.

create extension if not exists pgcrypto;

create or replace function public._generate_row_signature(
  p_user_id uuid,
  p_role text,
  p_is_premium boolean
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_secret text;
begin
  select key_value into v_secret
  from public._db_secrets
  where key_name = 'hmac_secret';

  if v_secret is null or length(v_secret) = 0 then
    raise exception 'Authentication profile security configuration is incomplete.';
  end if;

  return encode(
    extensions.hmac(
      p_user_id::text || ':' || coalesce(p_role, 'normal') || ':' || coalesce(p_is_premium, false)::text,
      v_secret,
      'sha256'
    ),
    'hex'
  );
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  client_device_hash text;
  client_ip text;
  client_subnet text;
  recent_subnet_signups int;
begin
  client_device_hash := nullif(trim(new.raw_user_meta_data->>'device_hash'), '');

  begin
    client_ip := split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1);
  exception when others then
    client_ip := null;
  end;

  client_subnet := public.get_ip_subnet(client_ip);

  if client_device_hash is not null
     and exists (select 1 from public.profiles where device_hash = client_device_hash) then
    raise exception 'Device hardware registration limit reached.' using errcode = 'unique_violation';
  end if;

  if client_subnet is not null then
    select count(*) into recent_subnet_signups
    from auth.users
    where created_at > (now() - interval '5 minutes')
      and id <> new.id;

    if recent_subnet_signups >= 3 then
      raise exception 'Network registration rate limit exceeded. Please retry shortly.'
        using errcode = 'too_many_requests';
    end if;
  end if;

  insert into public.profiles (
    user_id,
    full_name,
    avatar_url,
    role,
    device_hash,
    row_signature
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
    'normal',
    client_device_hash,
    public._generate_row_signature(new.id, 'normal', false)
  )
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (
  user_id, full_name, avatar_url, role, device_hash, is_premium, premium_until, row_signature
)
select
  u.id,
  nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
  nullif(trim(coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')), ''),
  'normal',
  nullif(trim(u.raw_user_meta_data->>'device_hash'), ''),
  false,
  null,
  public._generate_row_signature(u.id, 'normal', false)
from auth.users u
where not exists (select 1 from public.profiles p where p.user_id = u.id);

update public.profiles p
set
  full_name = coalesce(p.full_name, nullif(trim(u.raw_user_meta_data->>'full_name'), '')),
  avatar_url = coalesce(
    p.avatar_url,
    nullif(trim(coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')), '')
  ),
  row_signature = public._generate_row_signature(p.user_id, p.role::text, p.is_premium),
  updated_at = now()
from auth.users u
where u.id = p.user_id;
