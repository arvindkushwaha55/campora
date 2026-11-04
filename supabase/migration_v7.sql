-- ============================================================================
-- Campora migration v7 — comments on posts
-- Run AFTER migration_v6.sql (Supabase Dashboard -> SQL Editor -> Run).
--
-- Adds a comments table so students and guests can reply to posts, mirroring
-- the likes design (migration_v2):
--   * Any signed-in account (students AND anonymous guests — both use the
--     "authenticated" role) can READ all comments.
--   * A user can only INSERT a comment as themselves.
--   * A user can DELETE their own comments; admins can delete ANY comment
--     (moderation, same model as posts in migration_v4).
--   * Deleting a post or a profile removes its comments automatically.
-- Purely additive: no existing table, policy, or data is touched.
-- ============================================================================

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_created_idx
  on public.comments (post_id, created_at);

alter table public.comments enable row level security;

drop policy if exists "Signed-in users can read comments" on public.comments;
create policy "Signed-in users can read comments"
  on public.comments for select
  to authenticated
  using (true);

drop policy if exists "Users can add their own comments" on public.comments;
create policy "Users can add their own comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can delete any comment" on public.comments;
create policy "Admins can delete any comment"
  on public.comments for delete
  to authenticated
  using (public.is_admin());
