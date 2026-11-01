# Campora

> **Status: Work in Progress** — a personal mini project in active development. Campora is a **college-exclusive** social web app: only verified students of one configured college can join. Real accounts, real database (Supabase), admin-verified signups. It is a learning project, not a production social network.

**Live site:** https://arvindkushwaha55.github.io/campora/
(The live site connects to Supabase only after the repository variables in [Deployment](#deployment) are set.)

## The problem

General social media is open to everyone, which makes it noisy and impersonal for campus life. Students have no small, trusted space where **everyone is actually from their own college**. Campora is that space: a private campus feed where membership itself is verified.

## How verification works (the core idea)

Campora is **not** an open signup. A new account passes three gates:

1. **College email domain** — signup requires an email from the configured college domain (stored in the `colleges` table). This is enforced **in the database** by the signup trigger, not just in the form, so it cannot be bypassed by calling the API directly.
2. **Email confirmation** — the student confirms ownership of the email via Supabase's confirmation link.
3. **Admin approval of the College ID** — signup also collects the student's College ID / enrollment number, which must be **unique** (database-enforced). The account starts as `pending` and cannot see the feed, posts, likes, or other students until an **admin reviews and approves** it on the in-app Verification Desk (`/admin`).

> **Honest limitation:** there is no official college API or student database available to this project, so College ID verification is a **human admin check** (the admin compares the submitted ID with the student's ID card / college records). Campora never claims an ID is "verified" just because a student typed it in — an admin actually approves it.

Privacy by design: College IDs are stored in a separate private table (`student_private`) that only the student themself and admins can read. College IDs and email addresses are **never** shown to other students.

## Features (implemented)

- **Landing page** — explains the college-exclusive idea and the 3-step joining process.
- **College-exclusive signup** — full name, College ID (unique), college email (domain-checked), password, course (B.Tech / BCA / BBA / B.Pharmacy / Other), year (1st–4th / Other), optional profile picture.
- **Login / logout / forgot password** — email + password auth (Supabase Auth), with a working password-reset flow by email.
- **Verification-pending screen** — unverified students see their verification status, not the feed.
- **Profiles** — photo, name, course, year, and a short bio (up to 160 characters). Edit your own details and picture; view other verified students' profiles and their posts.
- **Campus feed** — text posts (up to 1000 characters) with an optional image, newest first, with author name/photo, course/year and timestamp. Loads in pages of 10 with "Load more". Posts are stored in the database, so they survive refresh and re-login.
- **Likes** — like/unlike any post; real counts from the database; the database primary key makes duplicate likes from the same student impossible.
- **Student discovery** — search verified students by name, filter by course and year.
- **Delete your own posts** — including their uploaded image.
- **Admin Verification Desk** (`/admin`) — admins see pending signups with their (admin-only) College IDs and can approve or reject them.
- **Security** — Row Level Security everywhere: only approved students can read the feed/profiles/likes; students can only edit their own profile and delete their own posts; a database trigger stops students from changing their own verification status or admin flag; uploads live in per-user storage folders with matching policies. No service-role key is ever used in the frontend.

### Not built (out of scope for this version)

Comments, direct messages, follow system, events, reels/video, and real-time updates are intentionally not part of this version.

## Tech stack

- **Next.js 15** (App Router) + **React 19**, **TypeScript**
- **Tailwind CSS v4**
- **Supabase** — Auth (email + password, email confirmation, password reset), Postgres with RLS, image storage
- **Git + GitHub**, deployment via **GitHub Pages** (static export)

## Architecture overview

```
Browser (Next.js static export)
   │  supabase-js with the public anon key
   ▼
Supabase
   ├── Auth          — accounts, email confirmation, password reset
   ├── Postgres      — colleges, profiles, student_private, posts, likes
   │     └── RLS + triggers enforce: college domain, unique College ID,
   │         approved-only feed, nobody can self-approve
   └── Storage       — avatars, post-images (per-user folders)
```

### Database schema

| Table | What it holds |
| --- | --- |
| `colleges` | The configured college: name, approved email domain, active flag. One row today; the design allows more colleges later. |
| `profiles` | Public student profile: name, course, year, avatar, bio, `verification_status` (pending/approved/rejected), `is_admin`, join date. |
| `student_private` | Private identity: the student's College ID. Readable only by the owner and admins. Unique College ID enforced here. |
| `posts` | Post text, optional image URL, author, timestamp. |
| `likes` | `(post_id, user_id)` pairs — the composite primary key prevents duplicate likes. |

## Getting started

### 1. Install

```bash
git clone https://github.com/arvindkushwaha55/campora.git
cd campora
npm install
```

### 2. Create the Supabase project and database

1. Go to [supabase.com](https://supabase.com) and create a free project (any name, e.g. `campora`).
2. In the dashboard, open **SQL Editor → New query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the base tables (`profiles`, `posts`), RLS policies, the signup trigger, and the `avatars` + `post-images` storage buckets.
3. Run [`supabase/migration_v2.sql`](supabase/migration_v2.sql) the same way. This adds the college configuration, College IDs, verification, likes, and the tightened RLS rules described above. **Check the seeded college email domain in that file (`rkgit.edu.in`) and change it if your college uses a different student email domain** — one `UPDATE` on the `colleges` table is enough.
4. Open **Authentication → Providers → Email** and turn **ON** "Confirm email" (students must confirm their college email).
5. Open **Authentication → URL Configuration**: set **Site URL** to your site URL (e.g. `https://arvindkushwaha55.github.io/campora/`) and add these **Redirect URLs** so email links land back in the app:
   - `https://arvindkushwaha55.github.io/campora/**`
   - `http://localhost:3000/**` (for local development)
6. Open **Project Settings → API** and copy the **Project URL** and the **anon/public key**.

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

## Admin setup

Admins approve new students, so at least one admin account is needed:

1. Sign up in the app normally with your own college email and College ID (or create the user in **Supabase → Authentication → Users**).
2. In the **SQL Editor**, run (replace the email with the admin's):

```sql
update public.profiles
set is_admin = true, verification_status = 'approved'
where id = (select id from auth.users where email = 'admin@example.com');
```

3. Log in — an **Admin** item appears in the navigation, opening the Verification Desk at `/admin`.

Day-to-day verification work (approving/rejecting students) happens in the app, not in SQL. To change the configured college or its email domain later, update the `colleges` table from the SQL Editor.

## Deployment

- **GitHub Pages:** pushes to `main` run `.github/workflows/deploy-pages.yml`, which builds the static export and deploys it.
- For the deployed site to connect to Supabase, add the two variables as repository **Variables** (not secrets — they are public): repo **Settings → Secrets and variables → Actions → Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- The workflow passes them into the build automatically.

## Project structure

```
campora/
├── src/
│   ├── app/            # routes: / (landing + feed), /login, /signup,
│   │                   # /forgot-password, /reset-password, /profile,
│   │                   # /students (discovery), /admin (verification desk)
│   ├── components/     # shell (nav), landing, feed (composer, post card),
│   │                   # common (auth gate, verification screen, inputs)
│   └── lib/            # supabase.ts (client), auth.tsx (session context), constants.ts
├── supabase/
│   ├── schema.sql         # v1 base schema — run first
│   └── migration_v2.sql   # college verification, likes, tightened RLS — run second
├── scripts/
│   └── verify_backend.py  # API checks for the v1 rules (auth/RLS/storage)
├── .github/workflows/     # GitHub Pages deployment
└── .env.example           # required environment variables (placeholders only)
```

## Testing

Verified during development: TypeScript typecheck and the production build pass; the SQL migration is verified by querying the live project structure (tables, columns, policies, triggers) after running it.

Honest notes:

- End-to-end tests of the full signup → email confirmation → admin approval → posting flow require real email inboxes and an admin account, so they are done manually against the deployed site after setup.
- `scripts/verify_backend.py` covers the v1 API surface (signup/login, RLS impersonation blocks, storage rules). It predates the v2 verification rules.

## Current limitations

- One college is configured (the schema allows more later, the UI assumes one).
- College ID verification is a manual admin review — there is no official college database/API to check against automatically.
- Supabase's built-in free email sending has low rate limits, which can slow down confirmation/reset emails when many students sign up at once.
- Like counts are computed in the browser from the `likes` table (fine at campus scale).
- The live site runs the version on `main`; newer work lands on feature branches first and is merged after review.

## Author

**Arvind Kushwaha** — B.Tech (AI & ML) student at Raj Kumar Goel Institute of Technology (RKGIT), Ghaziabad. Campora is a personal learning project being built step by step alongside my studies.
