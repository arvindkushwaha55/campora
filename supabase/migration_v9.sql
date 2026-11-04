-- Campora migration v9 — database-level abuse block for profiles.
--
-- Migration v8 blocked abusive post/comment text inside Postgres. This
-- closes the same bypass for identity fields: a profile's full_name or
-- bio cannot contain abusive language either, even if someone writes to
-- the API directly (e.g. signing up with an abusive name as metadata).
-- Purely additive: one function + one trigger; reuses the checker from
-- migration v8 (public.text_has_abuse). Existing profiles are untouched
-- — the trigger only fires on new inserts and on name/bio updates.

create or replace function public.block_abusive_profile()
returns trigger
language plpgsql
as $$
begin
  if public.text_has_abuse(new.full_name) or public.text_has_abuse(new.bio) then
    raise exception 'abusive language is not allowed on Campora';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_abuse on public.profiles;
create trigger profiles_block_abuse
  before insert or update of full_name, bio on public.profiles
  for each row execute function public.block_abusive_profile();
