-- Profiles are readable only by the signed-in owner/admin.
-- Sensitive account/device binding storage remains server-only.

alter table if exists public.profiles enable row level security;
alter table if exists public.device_account_bindings enable row level security;

revoke all on public.device_account_bindings from anon, authenticated;

comment on table public.device_account_bindings is
  'Server-authoritative device/account binding. Never expose directly to clients.';

comment on function public.claim_device_for_user(text, text) is
  'Authoritative one-device/one-account claim. Requires an authenticated JWT and trusted integrity verdict.';
