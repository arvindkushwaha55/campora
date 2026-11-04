-- Campora migration v8 — database-level abuse block for posts + comments.
--
-- The app already filters text in the browser (src/lib/moderation.ts).
-- This migration adds the same protection INSIDE Postgres, so abusive
-- content is rejected even if someone skips the app and calls the API
-- directly with their own key. Purely additive: one function + two
-- triggers, no existing table or policy is changed.
--
-- How it works: the text is lowercased, common leetspeak swaps are
-- undone (0->o, 1->i, 3->e, 4->a, 5->s, 7->t, @->a, $->s), and then a
-- whole-word (\m ... \M) regex checks it against the blocklist — so
-- innocent words that merely contain a bad substring ("class") pass.

create or replace function public.text_has_abuse(t text)
returns boolean
language sql
immutable
as $$
  select case
    when t is null then false
    else translate(lower(t), '013457@$', 'oieastas') ~
      '\m(fuck|fucker|fucking|motherfucker|shit|bullshit|bitch|bastard|asshole|dick|cock|pussy|whore|slut|porn|porno|nigger|nigga|faggot|retard|cunt|wanker|boobs|penis|vagina|sex|sexy|nude|naked|rape|rapist|pedophile|incest|madarchod|behenchod|bhenchod|bhosdike|bhosdi|chutiya|chutiye|gaand|gand|gandu|harami|haraami|kamina|kamine|kutta|kutti|saala|sala|randi|loda|lode|lund|lavda|jhaant|jhant|bakchod|bakchodi|bhadwa|bhadwe|chod|chodu|chudai|muth|mutthal|tatte|haramkhor|kaminey)\M'
  end;
$$;

create or replace function public.block_abusive_text()
returns trigger
language plpgsql
as $$
begin
  if public.text_has_abuse(new.text) then
    raise exception 'abusive language is not allowed on Campora';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_block_abuse on public.posts;
create trigger posts_block_abuse
  before insert or update of text on public.posts
  for each row execute function public.block_abusive_text();

drop trigger if exists comments_block_abuse on public.comments;
create trigger comments_block_abuse
  before insert or update of text on public.comments
  for each row execute function public.block_abusive_text();
