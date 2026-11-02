-- ============================================================================
-- Campora migration v4 — accounts activate instantly; admin moderates posts
-- Run AFTER migration_v3.sql (Supabase Dashboard -> SQL Editor -> Run).
--
-- Why (owner's decision, 2026-11-02): approving every signup by hand does
-- not scale — the admin does not have time to review each account. The
-- membership gates that remain are the ones that cost the admin nothing:
--   * the college email domain is still enforced by the signup trigger,
--   * email confirmation is still required before anyone can log in.
-- New accounts now start 'approved' (active immediately), and in return
-- the admin gains moderation powers: delete ANY post (and its image),
-- from the feed or from the /admin moderation page.
-- ============================================================================

-- 1. Signup trigger: same as v3, but the new profile starts approved.
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
      'approved'
    );
  else
    -- Dashboard-created accounts (no signup metadata): active immediately too.
    insert into public.profiles (id, full_name, course, year, verification_status)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
      coalesce(new.raw_user_meta_data ->> 'course', 'Other'),
      coalesce(new.raw_user_meta_data ->> 'year', 'Other'),
      'approved'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

-- 2. Nobody stays stuck: activate every existing account as well.
update public.profiles
   set verification_status = 'approved'
 where verification_status <> 'approved';

-- 3. Moderation: admins may delete ANY post (students still delete only
--    their own — the v1 policy stays, this one adds the admin right).
drop policy if exists "Admins can delete any post" on public.posts;
create policy "Admins can delete any post"
  on public.posts for delete
  to authenticated
  using (public.is_admin());

-- 4. ...and remove the deleted post's image file too.
drop policy if exists "Admins can delete any post image" on storage.objects;
create policy "Admins can delete any post image"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images' and public.is_admin());
