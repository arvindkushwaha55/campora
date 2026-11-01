-- Campora database schema for Supabase
-- Run this whole file once in the Supabase dashboard: SQL Editor -> New query -> Paste -> Run.
-- It creates the profiles + posts tables, Row Level Security (RLS) policies,
-- an automatic profile row for every new signup, and the two storage buckets
-- used for profile pictures and post images.

-- ---------------------------------------------------------------------------
-- 1. Profiles: one row per registered user (id = the auth user's id)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  course text not null check (course in ('B.Tech', 'BCA', 'BBA', 'B.Pharmacy', 'Other')),
  year text not null check (year in ('1st', '2nd', '3rd', '4th', 'Other')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Posts: text post with an optional image, owned by one user
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Automatically create a profile row when a user signs up.
--    The signup form passes full_name / course / year as user metadata.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, course, year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
    coalesce(new.raw_user_meta_data ->> 'course', 'Other'),
    coalesce(new.raw_user_meta_data ->> 'year', 'Other')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--    - Any signed-in user can read profiles and posts (the campus feed).
--    - A user can insert/update ONLY their own profile row.
--    - A user can create posts ONLY as themselves.
--    - A user can delete ONLY their own posts.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

drop policy if exists "Profiles are viewable by signed-in users" on public.profiles;
create policy "Profiles are viewable by signed-in users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Posts are viewable by signed-in users" on public.posts;
create policy "Posts are viewable by signed-in users"
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists "Users can create posts as themselves" on public.posts;
create policy "Users can create posts as themselves"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Storage buckets: avatars (profile pictures) and post-images.
--    Both are public to READ (so <img> tags work), but a user can only
--    upload / change / delete files inside their own folder: {user_id}/...
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Post images are publicly readable" on storage.objects;
create policy "Post images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "Users can upload to their own avatar folder" on storage.objects;
create policy "Users can upload to their own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar files" on storage.objects;
create policy "Users can update their own avatar files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own avatar files" on storage.objects;
create policy "Users can delete their own avatar files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload to their own post-images folder" on storage.objects;
create policy "Users can upload to their own post-images folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own post-image files" on storage.objects;
create policy "Users can delete their own post-image files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
