-- ============================================================================
-- Campora migration v5 — guest accounts (for teachers & visitors)
-- Run AFTER migration_v4.sql (Supabase Dashboard -> SQL Editor -> Run).
--
-- Why (owner's request, 2026-11-02): a teacher should be able to look
-- inside Campora without the full student signup. Guests enter with just
-- a name through Supabase anonymous sign-ins (which must also be enabled
-- in the dashboard: Authentication -> Providers -> Anonymous). Guest
-- profiles are flagged is_guest so the UI can label them "Guest" on
-- their profile, posts and discovery cards.
-- ============================================================================

-- 1. Flag on profiles.
alter table public.profiles
  add column if not exists is_guest boolean not null default false;

-- 2. Signup trigger: same as v4, but the no-metadata branch (anonymous
--    guests and dashboard-created accounts) records the guest flag.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg_domain text;
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

    insert into public.profiles (id, full_name, course, year, verification_status, is_guest)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
      coalesce(new.raw_user_meta_data ->> 'course', 'Other'),
      coalesce(new.raw_user_meta_data ->> 'year', 'Other'),
      'approved',
      false
    );
  else
    -- Anonymous guests (metadata carries guest=true) and dashboard-created
    -- accounts: active immediately; guests are flagged for the UI label.
    insert into public.profiles (id, full_name, course, year, verification_status, is_guest)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
      coalesce(new.raw_user_meta_data ->> 'course', 'Other'),
      coalesce(new.raw_user_meta_data ->> 'year', 'Other'),
      'approved',
      coalesce(new.raw_user_meta_data ->> 'guest', 'false')::boolean
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
