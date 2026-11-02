-- ============================================================================
-- Campora migration v3 — College ID is no longer collected at signup
-- Run AFTER migration_v2.sql (Supabase Dashboard -> SQL Editor -> Run).
--
-- Why: students do not remember their College ID / enrollment number, so
-- create-account now asks only for the college email (owner's decision,
-- 2026-11-02). Membership control is otherwise unchanged:
--   * the college email domain is still enforced by this signup trigger,
--   * email confirmation is still required,
--   * every new account still starts as 'pending' until an admin approves
--     it on the Verification Desk.
-- The student_private table and the college_id_available() helper from v2
-- are deliberately left in place (unused) so this migration changes no
-- stored data; the only change is the signup trigger below.
-- ============================================================================

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

    insert into public.profiles (id, full_name, course, year, verification_status)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
      coalesce(new.raw_user_meta_data ->> 'course', 'Other'),
      coalesce(new.raw_user_meta_data ->> 'year', 'Other'),
      'pending'
    );
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

-- The on_auth_user_created trigger from v2 already points at this
-- function, so nothing else needs to change.
