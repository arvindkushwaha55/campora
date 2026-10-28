# Campora

> **Status: Work in Progress** — A personal mini project in active development. Campora is now a simple full-stack web app: real signup/login, student profiles, and posts stored in a database (Supabase). It is a learning project, not a production social network.

**Live Demo:** https://arvindkushwaha55.github.io/campora/
(The live demo only works once the Supabase environment variables below are configured for the deployment — see [Deployment](#deployment).)

## Overview

Campora is a campus-based social networking web app for college students. Students create an account with their name, course, and year of study; share text posts with an optional photo; and see a campus feed with posts from other registered students.

## Features (implemented)

- **Accounts** — email + password signup, login, and logout (Supabase Auth). Signup collects full name, course (B.Tech / BCA / BBA / B.Pharmacy / Other), year of study (1st–4th / Other), and an optional profile picture.
- **Profiles** — every user has a profile (photo, name, course, year). You can edit your own details and change your profile picture, and view other students' profiles.
- **Posts** — write a text post (up to 1000 characters) with an optional image. Posts are stored in the database, so they survive refresh and logout/login.
- **Campus feed** — posts from all registered users, newest first, with the author's name, profile picture, course/year, and the post's date and time.
- **Delete your own posts** — including their uploaded image.
- **Security** — Row Level Security (RLS) in the database: users can only edit their own profile, create posts as themselves, and delete their own posts. Uploaded files are stored in per-user folders with matching storage policies.

### Not built (out of scope for this version)

Comments, likes, direct messages, follow system, events, and real-time updates are intentionally not part of this version.

## Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** — authentication, Postgres database, and image storage
- **Git + GitHub** for version control
- Deployment: **GitHub Pages** (static export)

## Getting Started

### 1. Install

```bash
git clone https://github.com/arvindkushwaha55/campora.git
cd campora
npm install
```

### 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project (any name, e.g. `campora`).
2. In the dashboard, open **SQL Editor → New query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `profiles` and `posts` tables, the RLS policies, the automatic profile-on-signup trigger, and the `avatars` + `post-images` storage buckets.
3. Open **Authentication → Providers → Email** and turn **off** "Confirm email" (for this learning project, so users can log in immediately after signup).
4. Open **Project Settings → API** and copy the **Project URL** and the **anon/public key**.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These two values are public client credentials (safe in the browser — RLS protects the data). **Never** commit `.env.local`, and never put the secret service-role key in the frontend.

### 4. Run

```bash
npm run dev
# Open http://localhost:3000
```

Other commands:

```bash
npm run build      # production build (static export into out/)
npm run typecheck  # TypeScript check without emitting files
```

## Deployment

- **GitHub Pages:** pushes to `main` run `.github/workflows/deploy-pages.yml`, which builds the static export and deploys it.
- For the deployed site to connect to Supabase, add the two variables as repository **Variables** (not secrets — they are public): repo **Settings → Secrets and variables → Actions → Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- The workflow passes them into the build automatically.

## Project Structure

```
campora/
├── src/
│   ├── app/            # routes: / (feed), /login, /signup, /profile
│   ├── components/     # shell (nav), feed (composer, post card), common (auth helpers)
│   └── lib/            # supabase.ts (client), auth.tsx (session context), constants.ts
├── supabase/
│   └── schema.sql      # tables, RLS policies, storage buckets — run once in Supabase
├── scripts/
│   └── verify_backend.py  # API checks: signup, RLS and storage rules (see file header)
├── .github/workflows/  # GitHub Pages deployment
└── .env.example        # required environment variables (placeholders only)
```

## Current Limitations

- One shared campus feed for all users (no per-college separation yet)
- No password-reset flow in the UI yet (passwords can be reset via Supabase if needed)
- Email confirmation is disabled for simplicity in this learning project
- Sample/demo accounts you create are real rows in your own Supabase project — delete them from the Supabase dashboard if you want a clean start

## Author

**Arvind Kushwaha** — B.Tech (AI & ML) student at Raj Kumar Goel Institute of Technology (RKGIT), Ghaziabad. Campora is a personal learning project being built step by step alongside my studies.
