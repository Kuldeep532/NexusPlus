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

  -- Supabase Auth already treats email as the account identity; this extra normalized check prevents case-variant duplicates.
  if exists (
    select 1
    from auth.users u
    where lower(trim(u.email)) = lower(trim((select email from auth.users where id = v_user_id)))
      and u.id <> v_user_id
  ) then
    raise exception using errcode = '23505', message = 'An account with this email already exists.';
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
