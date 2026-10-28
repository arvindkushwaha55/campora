# Campora — Your Campus, Connected

Campora is a simple **full-stack** campus social web app for college students.
Students create an account with their name and college details, log in, share
text posts (with an optional photo), and see everyone's posts in one campus
feed. It is a beginner-friendly learning / mini project.

- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4, exported as a static site
- **Backend:** [Supabase](https://supabase.com) — email/password authentication, PostgreSQL database, and file storage
- **Deployment:** GitHub Pages (static export via GitHub Actions)

## Features

- Sign up with full name, email, password, course (B.Tech / BCA / BBA / B.Pharmacy / Other), year (1st–4th / Other) and an optional profile picture
- Log in / log out (Supabase Auth — no custom auth code)
- Profile page: view and edit name, course, year and profile picture; see your own posts
- View other students' profiles and their posts
- Create posts: text (up to 1000 characters) with an optional image (max 5 MB)
- Campus feed: everyone's posts, newest first, with author name, photo, course, year and date-time
- Delete your own posts (with confirmation)
- Security: Row Level Security (RLS) on every table and storage bucket — a user can only change their own profile, their own posts and their own files

Not included (kept simple on purpose): comments, likes, messaging, search,
events and rankings.

## Run it locally

You need Node.js 20+ and a free Supabase project.

### 1. Clone and install

```bash
git clone https://github.com/arvindkushwaha55/campora.git
cd campora
cp .env.example .env.local
npm install
```

### 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (any name, e.g. "campora").
2. Open **SQL Editor → New query**, paste the whole contents of
   [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates
   the `profiles` and `posts` tables, the signup trigger, all RLS policies and
   the `avatars` + `post-images` storage buckets.
3. (Recommended for local testing) **Authentication → Providers → Email** →
   turn **OFF** "Confirm email" so new accounts can log in immediately.
4. **Settings → API**: copy the **Project URL** and the **anon public** key.

### 3. Add the keys and start

Put the two values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

These are **public** client credentials — the anon key is designed for the
browser, and Row Level Security protects the data. **Never** put the
service-role key in the frontend.

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # TypeScript check
npm run build      # production build (static export into out/)
```

If the keys are missing, the app shows a friendly "not connected yet" screen
instead of fake data.

## Deployment (GitHub Pages)

The workflow in `.github/workflows/deploy-pages.yml` builds the static export
on every push to `main`. The build needs the two public keys as repository
**Variables** (not Secrets):

**Settings → Secrets and variables → Actions → Variables → New repository variable**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then push to `main` (or re-run the "Deploy Campora to GitHub Pages" workflow).
Live site: https://arvindkushwaha55.github.io/campora/

## Project structure

```
src/
  app/            Pages: / (feed), /login, /signup, /profile
  components/     Shell (nav), feed + composer + post card, shared UI helpers, icons
  lib/
    supabase.ts   Supabase client (from env vars)
    auth.tsx      Session + profile context (useAuth)
    constants.ts  Course/year lists, shared types and limits
supabase/
  schema.sql      Tables, RLS policies, signup trigger, storage buckets
scripts/
  verify_backend.py  End-to-end API checks: signup, RLS and storage rules
                     (run: python3 scripts/verify_backend.py from a normal network)
```

## Notes and limitations

- Static export: no server-side rendering; all data is fetched in the browser
  from Supabase. This is why GitHub Pages hosting works.
- Password reset by email is not wired into the UI yet (Supabase supports it;
  adding a "forgot password" page is a good next step).
- Demo/learning project: keep real personal data out of posts.

## Status

Work in progress — built for learning and as a CV mini project.
