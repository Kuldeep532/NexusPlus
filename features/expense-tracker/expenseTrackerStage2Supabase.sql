-- Stage 2 reference schema for the verified Supabase project.
-- Enable RLS before production use. The authenticated user may access only their rows.

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('manual','payment-announcer','sms','saved-category')),
  category text not null,
  merchant_name text,
  note text,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  occurred_at_ms bigint not null,
  external_transaction_id text,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  is_saved_category boolean not null default false,
  created_at_ms bigint not null,
  updated_at_ms bigint not null,
  unique (user_id, external_transaction_id)
);

alter table public.expenses enable row level security;

create policy "expenses_select_own" on public.expenses
for select using (auth.uid() = user_id);

create policy "expenses_insert_own" on public.expenses
for insert with check (auth.uid() = user_id);

create policy "expenses_update_own" on public.expenses
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "expenses_delete_own" on public.expenses
for delete using (auth.uid() = user_id);
