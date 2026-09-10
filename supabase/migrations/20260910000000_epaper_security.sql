create extension if not exists pgcrypto;
create extension if not exists pg_cron with schema extensions;

create table if not exists public.epapers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  storage_path text not null,
  file_ext text not null default '.nxl',
  status text not null default 'LOCKED' check (status in ('LOCKED','UNLOCKED','EXPIRED','TAMPERED')),
  lock_at timestamptz,
  unlock_at timestamptz not null,
  print_from timestamptz,
  expires_at timestamptz,
  content_sha256 text not null,
  key_version integer not null default 1,
  algorithm text not null default 'AES-256-GCM',
  release_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists epapers_owner_idx on public.epapers(owner_id);
create index if not exists epapers_unlock_idx on public.epapers(unlock_at);
create index if not exists epapers_expiry_idx on public.epapers(expires_at);

alter table public.epapers enable row level security;

revoke all on public.epapers from anon;
grants? 
revoke all on public.epapers from authenticated;

create policy "owners can read their e-papers"
  on public.epapers for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "owners can create their e-papers"
  on public.epapers for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "owners can update their e-papers"
  on public.epapers for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create or replace function public.epaper_access(p_id uuid)
returns table (
  id uuid,
  title text,
  access_status text,
  unlock_at timestamptz,
  print_from timestamptz,
  expires_at timestamptz,
  storage_path text
)
language sql
security invoker
as $$
  select
    e.id,
    e.title,
    case
      when e.status = 'TAMPERED' then 'TAMPERED'
      when e.expires_at is not null and now() >= e.expires_at then 'EXPIRED'
      when now() >= e.unlock_at then 'ACCESSIBLE'
      else 'LOCKED'
    end as access_status,
    e.unlock_at,
    e.print_from,
    e.expires_at,
    case when now() >= e.unlock_at and (e.expires_at is null or now() < e.expires_at) then e.storage_path else null end
  from public.epapers e
  where e.id = p_id;
$$;

create or replace function public.epaper_mark_windows()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.epapers
  set status = case
      when expires_at is not null and now() >= expires_at then 'EXPIRED'
      when now() >= unlock_at then 'UNLOCKED'
      else 'LOCKED'
    end,
    updated_at = now()
  where status <> 'TAMPERED';
end;
$$;

select cron.schedule(
  'epaper-window-refresh',
  '* * * * *',
  $$select public.epaper_mark_windows();$$
);

select cron.schedule(
  'epaper-expiry-cleanup',
  '0 * * * *',
  $$delete from public.epapers where expires_at is not null and now() >= expires_at;$$
);
