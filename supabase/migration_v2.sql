-- Campora v2 migration: college-exclusive access, verification and likes.
-- Run this whole file ONCE in the Supabase dashboard (SQL Editor -> New query
-- -> Paste -> Run) AFTER the v1 schema.sql. It is written to be safe to
-- re-run: existing objects are kept, policies are replaced by name.
--
-- What it adds:
--   1. public.colleges          - the configured college (name + email domain)
--   2. profiles.bio, profiles.verification_status, profiles.is_admin
--   3. public.student_private   - College IDs, visible ONLY to the owner
--                                 and to admins (never shown publicly)
--   4. public.likes             - one like per student per post
--   5. A stricter signup trigger: enforces the college email domain and a
--      unique College ID on the DATABASE side (not just in the form)
--   6. A protection trigger: students cannot change their own
--      verification_status or is_admin flag - only admins can
--   7. Updated RLS: the feed, profiles, discovery and likes are readable
--      only by APPROVED students (and admins)

-- ---------------------------------------------------------------------------
-- 1. College configuration (single-college for now, table allows more later)
--    email_domain NULL/empty = domain check OFF (admin approval is the gate).
--    IMPORTANT: confirm the domain below is your college's real student
--    email domain. Change it any time with one UPDATE in the SQL editor.
-- ---------------------------------------------------------------------------
create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email_domain text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.colleges (name, email_domain)
select 'Raj Kumar Goel Institute of Technology', 'rkgit.edu.in'
where not exists (select 1 from public.colleges);

alter table public.colleges enable row level security;

drop policy if exists "College config is readable" on public.colleges;
create policy "College config is readable"
  on public.colleges for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policies: only the dashboard/service role can
-- change the college configuration.

-- ---------------------------------------------------------------------------
-- 2. Profile additions: bio, verification status, admin flag
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists bio text check (char_length(bio) <= 160);
alter table public.profiles
  add column if not exists verification_status text not null default 'pending'
  check (verification_status in ('pending', 'approved', 'rejected'));
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ---------------------------------------------------------------------------
-- 3. Helper functions used by the policies below
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.verification_status = 'approved' from public.profiles p where p.id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------------
-- 4. Private identity table: College IDs live here, NOT in public profiles,
--    so no other student can ever read them through the API.
-- ---------------------------------------------------------------------------
create table if not exists public.student_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  college_id text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists student_private_college_id_key
  on public.student_private (college_id);

alter table public.student_private enable row level security;

drop policy if exists "Students see only their own private record" on public.student_private;
create policy "Students see only their own private record"
  on public.student_private for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());
-- No insert/update/delete policies for students: rows are written by the
-- signup trigger (security definer) and managed by admins via the dashboard.

-- Availability check for the signup form. Returns TRUE when the College ID
-- is not registered yet. (The unique index above is the real enforcement;
-- this only gives the form a friendly early warning.)
create or replace function public.college_id_available(cid text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (select 1 from public.student_private where college_id = cid)
$$;

grant execute on function public.college_id_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Likes: one row per (post, student) - the primary key prevents
--    duplicate likes from the same student.
-- ---------------------------------------------------------------------------
create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists likes_post_id_idx on public.likes (post_id);

alter table public.likes enable row level security;

drop policy if exists "Likes are viewable by approved students" on public.likes;
create policy "Likes are viewable by approved students"
  on public.likes for select
  to authenticated
  using (public.is_approved() or public.is_admin());

drop policy if exists "Approved students can like posts" on public.likes;
create policy "Approved students can like posts"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = user_id and (public.is_approved() or public.is_admin()));

drop policy if exists "Students can remove their own likes" on public.likes;
create policy "Students can remove their own likes"
  on public.likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Signup trigger v2: creates the profile (status 'pending') and the
--    private College ID record. Enforces the college email domain and the
--    minimum profile data on the database side. Fires only for normal app
--    signups (identified by the course/year metadata the form sends), so
--    accounts created directly in the Supabase dashboard are not blocked.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg_domain text;
  meta_college_id text;
begin
  if new.raw_user_meta_data ? 'course' then
    -- College email domain enforcement (backend, cannot be bypassed by the UI)
    select email_domain into cfg_domain
      from public.colleges
      where is_active
      order by created_at
      limit 1;
    if cfg_domain is not null and cfg_domain <> '' then
      if lower(split_part(coalesce(new.email, ''), '@', 2)) <> lower(cfg_domain) then
        raise exception 'Only % college email addresses can register for Campora', cfg_domain;
      end if;
    end if;

    meta_college_id := nullif(trim(coalesce(new.raw_user_meta_data ->> 'college_id', '')), '');
    if meta_college_id is null then
      raise exception 'College ID is required';
    end if;

    insert into public.profiles (id, full_name, course, year, verification_status)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
      coalesce(new.raw_user_meta_data ->> 'course', 'Other'),
      coalesce(new.raw_user_meta_data ->> 'year', 'Other'),
      'pending'
    );

    insert into public.student_private (user_id, college_id)
    values (new.id, meta_college_id);
  else
    -- Dashboard-created accounts (no signup metadata): keep the v1 behaviour
    -- so an admin account can be created there without being blocked.
    insert into public.profiles (id, full_name, course, year)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
      coalesce(new.raw_user_meta_data ->> 'course', 'Other'),
      coalesce(new.raw_user_meta_data ->> 'year', 'Other')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 7. Protection trigger: a student can never change their own
--    verification_status or is_admin flag. Only admins (inside the app) and
--    the dashboard/service role (no auth.uid) may change them.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.verification_status is distinct from old.verification_status
       or new.is_admin is distinct from old.is_admin then
      raise exception 'Only admins can change verification status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- 8. Updated RLS policies
--    Profiles: you can always read your OWN profile (needed for the
--    "verification pending" screen). Reading OTHER students requires an
--    approved account (or admin). Posts/likes: approved students + admins.
-- ---------------------------------------------------------------------------
drop policy if exists "Profiles are viewable by signed-in users" on public.profiles;
drop policy if exists "Profiles viewable by owner, approved students and admins" on public.profiles;
create policy "Profiles viewable by owner, approved students and admins"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_approved() or public.is_admin());

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Posts are viewable by signed-in users" on public.posts;
drop policy if exists "Posts are viewable by approved students" on public.posts;
create policy "Posts are viewable by approved students"
  on public.posts for select
  to authenticated
  using (public.is_approved() or public.is_admin());

drop policy if exists "Users can create posts as themselves" on public.posts;
drop policy if exists "Approved students can create posts as themselves" on public.posts;
create policy "Approved students can create posts as themselves"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id and (public.is_approved() or public.is_admin()));
-- The v1 delete policy ("Users can delete their own posts") stays unchanged.
