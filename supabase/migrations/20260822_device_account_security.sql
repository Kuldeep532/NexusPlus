create table if not exists public.device_account_bindings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  device_binding_id text not null,
  status text not null default 'active' check (status in ('active','pending_delete','blocked')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deletion_lock_until timestamptz,
  blocked_at timestamptz,
  block_reason text,
  unique (device_binding_id),
  unique (account_id)
);

alter table public.device_account_bindings enable row level security;

create index if not exists device_account_bindings_device_idx
  on public.device_account_bindings (device_binding_id);

create index if not exists device_account_bindings_account_idx
  on public.device_account_bindings (account_id);

create or replace function public.bind_account_to_device(
  p_account_id uuid,
  p_device_binding_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_device public.device_account_bindings;
  existing_account public.device_account_bindings;
begin
  if auth.uid() is null or auth.uid() <> p_account_id then
    raise exception 'unauthorized';
  end if;

  select * into existing_device
  from public.device_account_bindings
  where device_binding_id = p_device_binding_id
  for update;

  if existing_device.id is not null and existing_device.account_id <> p_account_id then
    return jsonb_build_object('allowed', false, 'reason', 'device_already_bound');
  end if;

  select * into existing_account
  from public.device_account_bindings
  where account_id = p_account_id
  for update;

  if existing_account.id is not null then
    if existing_account.status = 'blocked' then
      return jsonb_build_object('allowed', false, 'reason', 'account_blocked');
    end if;

    if existing_account.status = 'pending_delete'
       and existing_account.deletion_lock_until is not null
       and existing_account.deletion_lock_until > now() then
      return jsonb_build_object('allowed', false, 'reason', 'deletion_cooldown');
    end if;

    if existing_account.device_binding_id <> p_device_binding_id then
      return jsonb_build_object('allowed', false, 'reason', 'account_already_bound');
    end if;

    update public.device_account_bindings
      set status = 'active', deleted_at = null, deletion_lock_until = null
      where id = existing_account.id;

    return jsonb_build_object('allowed', true, 'reason', 'allowed');
  end if;

  insert into public.device_account_bindings(account_id, device_binding_id)
  values (p_account_id, p_device_binding_id);

  return jsonb_build_object('allowed', true, 'reason', 'allowed');
end;
$$;

revoke all on function public.bind_account_to_device(uuid, text) from public;
grant execute on function public.bind_account_to_device(uuid, text) to authenticated;

create or replace function public.request_account_deletion(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_account_id then
    raise exception 'unauthorized';
  end if;

  update public.device_account_bindings
     set status = 'pending_delete',
         deleted_at = now(),
         deletion_lock_until = now() + interval '30 days'
   where account_id = p_account_id;
end;
$$;

revoke all on function public.request_account_deletion(uuid) from public;
grant execute on function public.request_account_deletion(uuid) to authenticated;
