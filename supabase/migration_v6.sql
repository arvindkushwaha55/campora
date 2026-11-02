-- ============================================================================
-- Campora migration v6 — close the college-verification bypass
-- Run AFTER migration_v5.sql (Supabase Dashboard -> SQL Editor -> Run).
--
-- The issue (found in the 2026-11-02 security audit): up to v5, the signup
-- trigger only checked the college email domain when the signup metadata
-- contained a 'course' field (which the Campora signup form always sends).
-- A signup made directly against the auth API *without* that metadata fell
-- into the "guest / dashboard account" branch and received an approved,
-- non-guest profile on ANY email address — bypassing college verification
-- completely.
--
-- The fix: the rule is now based on the account itself, not on metadata.
--   * No email address at all  -> anonymous guest (always flagged guest).
--   * Any email address        -> the college domain check ALWAYS runs,
--                                 whether the signup came from the form,
--                                 the raw API, or the dashboard.
-- Dashboard-created accounts keep working because they use college emails.
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
  if coalesce(new.email, '') = '' then
    -- Anonymous guest (Supabase anonymous sign-ins have no email). Guests
    -- are always flagged is_guest and are active immediately.
    insert into public.profiles (id, full_name, course, year, verification_status, is_guest)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
      'Other',
      'Other',
      'approved',
      true
    )
    on conflict (id) do nothing;
    return new;
  end if;

  -- College email domain enforcement (backend, cannot be bypassed by the
  -- UI or by omitting signup metadata).
  select email_domain into cfg_domain
    from public.colleges
    where is_active
    order by created_at
    limit 1;
  if cfg_domain is not null and cfg_domain <> '' then
    if lower(split_part(new.email, '@', 2)) <> lower(cfg_domain) then
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
  return new;
end;
$$;
