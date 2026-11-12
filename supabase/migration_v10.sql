-- Campora migration v10 — stronger abuse word list for the database filter.
--
-- Why (2026-11-12): a post containing the word "chud" reached the live
-- feed because that spelling was missing from BOTH the app list
-- (src/lib/moderation.ts) and the database list (migration_v8). The app
-- list is expanded in the same change; this migration refreshes the
-- database function to match, and adds Devanagari-script words, which
-- neither layer checked before.
--
-- This migration ONLY replaces public.text_has_abuse(). The triggers
-- installed by migration_v8 (posts/comments) and migration_v9 (profiles)
-- call that function, so they pick up the new list automatically — no
-- table, policy or data is changed.
--
-- Latin words: whole-word match (\m ... \M) after leetspeak translation,
-- exactly as in v8, so innocent words containing a bad substring
-- ("class", "assignment") still pass. Devanagari words: plain substring
-- checks, because Postgres word boundaries are unreliable around
-- combining vowel signs; the listed forms are abuse-specific.

create or replace function public.text_has_abuse(t text)
returns boolean
language sql
immutable
as $$
  select case
    when t is null then false
    else (
      translate(lower(t), '013457@$', 'oieastas') ~
        '\m(fuck|fucker|fucking|motherfucker|motherfucking|fuckin|shit|bullshit|bitch|bastard|asshole|arsehole|dick|dickhead|shithead|cock|pussy|whore|slut|porn|porno|nigger|nigga|faggot|retard|cunt|wanker|boobs|penis|vagina|sex|sexy|nude|naked|rape|rapist|pedophile|incest|madarchod|maadarchod|behenchod|behnchod|bhenchod|bhosdike|bhosdi|bhosda|bhosde|chutiya|chutiye|chutiyapa|gaand|gand|gandu|gaandu|harami|haraami|haramzada|haramzade|haramzadi|kamina|kamine|kutta|kutti|kutiya|saala|sala|saali|randi|loda|lode|lund|lavda|lawda|lauda|laude|jhaant|jhant|bakchod|bakchodi|bhadwa|bhadwe|chod|chodu|chud|chuda|chude|chudi|chudwa|chudakkad|chudail|chudai|muth|mutthal|tatte|haramkhor|kaminey)\M'
      or lower(t) like '%चुद%'
      or lower(t) like '%चूतिया%'
      or lower(t) like '%मादरचोद%'
      or lower(t) like '%बहनचोद%'
      or lower(t) like '%भोसडी%'
      or lower(t) like '%गांड%'
      or lower(t) like '%गाँडू%'
      or lower(t) like '%हरामी%'
      or lower(t) like '%कमीना%'
      or lower(t) like '%कुत्ता%'
      or lower(t) like '%कुत्ती%'
      or lower(t) like '%साला%'
      or lower(t) like '%रंडी%'
      or lower(t) like '%लौड़ा%'
    )
  end;
$$;
