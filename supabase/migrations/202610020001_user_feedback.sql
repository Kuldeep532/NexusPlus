-- Nexus Plus user feedback.
-- Stores feedback submitted from the app. RLS keeps each user's submissions private.
create table if not exists public.user_feedback (
  feedback_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  name text not null check (char_length(trim(name)) between 1 and 120),
  message text not null check (char_length(trim(message)) between 1 and 5000),
  email text,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_user_idx
  on public.user_feedback(user_id, created_at desc);

alter table public.user_feedback enable row level security;

drop policy if exists "Users can submit feedback" on public.user_feedback;
create policy "Users can submit feedback"
  on public.user_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own feedback" on public.user_feedback;
create policy "Users can view own feedback"
  on public.user_feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Feedback updates remain server/admin controlled.
revoke update, delete on public.user_feedback from authenticated;
