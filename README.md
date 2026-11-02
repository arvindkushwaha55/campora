# Campora

> **Status: Work in Progress** — a personal mini project in active development. Campora is a **college-exclusive** social web app: only verified students of one configured college can join. Real accounts, real database (Supabase), admin-verified signups. It is a learning project, not a production social network.

**Live site:** https://arvindkushwaha55.github.io/campora/

## The problem

General social media is open to everyone, which makes it noisy and impersonal for campus life. Students have no small, trusted space where **everyone is actually from their own college**. Campora is that space: a private campus feed where membership itself is verified.

## How verification works (the core idea)

Campora is **not** an open signup. A new account passes three gates:

1. **College email domain** — signup requires an email from the configured college domain (stored in the `colleges` table). This is enforced **in the database** by the signup trigger, not just in the form, so it cannot be bypassed by calling the API directly.
2. **Email confirmation** — the student confirms ownership of the email via Supabase's confirmation link.
3. **Instant activation** — once the email is confirmed, the account is active immediately: feed, posts, likes and student discovery all unlock with no waiting. (An earlier version made an admin approve every account by hand; that was removed in v4 — approving everyone did not scale. The admin moderates instead: they can delete any post.) Signup asks only for the college email — **no College ID** (students rarely remember theirs, so the field was removed in v3; an earlier version collected it).

> **Honest limitation:** there is no official college API or student database available to this project, so Campora cannot prove someone is a real student beyond control of a college email inbox. Membership relies on the college email domain + email confirmation, and the admin removes anything (or anyone's post) that does not belong.

Privacy by design: email addresses are **never** shown to other students — profiles show only name, course, year, photo and bio.

## Features (implemented)

- **Landing page** — premium product page: a live-style preview of the real feed with actual campus photos, the college-exclusive idea, feature cards, a campus-life photo strip, the 3-step joining process and a clean footer. No fake counts or testimonials.
- **College-exclusive signup** — full name, college email (domain-checked), password, course (B.Tech / BCA / BBA / B.Pharmacy / Other), year (1st–4th / Other), optional profile picture.
- **Login / logout / forgot password** — email + password auth (Supabase Auth), with a working password-reset flow by email.
- **Instant access** — after email confirmation the feed unlocks right away; there is no approval queue.
- **Guest entry** — teachers and visitors can enter from the login page with just a name (Supabase anonymous sign-ins; no email or password). Guest accounts are flagged `is_guest` and labelled “Guest” on their profile, posts and discovery cards; the session lives on that device.
- **Profiles** — photo, name, course, year, and a short bio (up to 160 characters). Edit your own details and picture; view other verified students' profiles and their posts.
- **Campus feed** — text posts (up to 1000 characters) with an optional image, newest first, with author name/photo, course/year and timestamp. Loads in pages of 10 with "Load more". Posts are stored in the database, so they survive refresh and re-login. On wide screens the feed gets a third column: a discovery rail with the college card and the newest verified students. Post cards have a like animation, an options menu for your own posts, and skeleton loading states.
- **Profiles** — ink cover band with a campus-path pattern, verified badge, bio and the student’s posts with working likes.
- **Auth polish** — password show/hide toggle on login, signup and reset; premium auth cards with an ink brand strip.
- **Design language (“Editorial Campus”)** — warm ivory surfaces and deep-ink text, electric cobalt as the primary colour and coral as the controlled accent (likes, highlights); Fraunces serif display type for headlines paired with Plus Jakarta Sans for UI; a dotted campus-map background motif, an editorial ticker of real campus phrases on the landing page, and solid colours instead of SaaS-style gradients. The whole palette is centralised as design tokens in `src/app/globals.css`.
- **Dark theme** — a light/dark toggle (landing page, auth pages, sidebar and mobile top bar). The first visit follows the system preference; the choice is remembered on the device and applied before the page paints, so there is no flash of the wrong theme.
- **Likes** — like/unlike any post; real counts from the database; the database primary key makes duplicate likes from the same student impossible.
- **Student discovery** — search verified students by name, filter by course and year.
- **Delete your own posts** — including their uploaded image.
- **Admin moderation** (`/admin`) — admins see every post in one list and can delete any post (also possible directly in the feed). Students can still delete only their own posts.
- **Security** — Row Level Security everywhere: only signed-in, email-confirmed students of the college can read the feed/profiles/likes; students can only edit their own profile and delete their own posts, while admins can delete any post (moderation); the signup trigger enforces the college email domain on every email signup, with or without form metadata (hardened in v6), and a protection trigger stops students from changing their own verification status or admin flag; uploads live in per-user storage folders with matching policies. No service-role key is ever used in the frontend.

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
   ├── Postgres      — colleges, profiles, posts, likes
   │     └── RLS + triggers enforce: college domain, confirmed
   │         students only, admin-only moderation
   └── Storage       — avatars, post-images (per-user folders)
```

### Database schema

| Table | What it holds |
| --- | --- |
| `colleges` | The configured college: name, approved email domain, active flag. One row today; the design allows more colleges later. |
| `profiles` | Public student profile: name, course, year, avatar, bio, `verification_status` (accounts are `approved` on signup since v4; the column remains from the earlier approval flow), `is_admin`, join date. |
| `student_private` | Legacy from v2: held College IDs when signup collected them. No longer written or read since migration v3; kept only so no stored data was deleted. |
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
3. Run [`supabase/migration_v2.sql`](supabase/migration_v2.sql) the same way. This adds the college configuration, verification, likes, and the tightened RLS rules described above. **Check the seeded college email domain in that file (`rkgit.edu.in`) and change it if your college uses a different student email domain** — one `UPDATE` on the `colleges` table is enough.
4. Run [`supabase/migration_v3.sql`](supabase/migration_v3.sql) the same way. This removes the College ID requirement from the signup trigger (email-only signup).
5. Run [`supabase/migration_v4.sql`](supabase/migration_v4.sql) the same way. This makes accounts active immediately after email confirmation (no admin approval) and gives admins delete-any-post moderation rights.
6. Run [`supabase/migration_v5.sql`](supabase/migration_v5.sql) the same way. This adds the `is_guest` flag for guest accounts.
7. Run [`supabase/migration_v6.sql`](supabase/migration_v6.sql) the same way. This hardens the signup trigger: the college-domain check now runs on **every** email signup (previously it could be skipped by omitting signup metadata), and anonymous accounts are always flagged as guests.
8. Open **Authentication → Providers → Email** and turn **ON** "Confirm email" (students must confirm their college email). Also open **Authentication → Providers → Anonymous** and turn **ON** anonymous sign-ins, so the guest entry on the login page works.
8. Open **Authentication → URL Configuration**: set **Site URL** to your site URL (e.g. `https://arvindkushwaha55.github.io/campora/`) and add these **Redirect URLs** so email links land back in the app:
   - `https://arvindkushwaha55.github.io/campora/**`
   - `http://localhost:3000/**` (for local development)
9. Open **Project Settings → API** and copy the **Project URL** and the **anon/public key**.

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

Admins moderate the feed (delete any post), so at least one admin account is needed:

1. Sign up in the app normally with your own college email (or create the user in **Supabase → Authentication → Users**).
2. In the **SQL Editor**, run (replace the email with the admin's):

```sql
update public.profiles
set is_admin = true, verification_status = 'approved'
where id = (select id from auth.users where email = 'admin@example.com');
```

3. Log in — an **Admin** item appears in the navigation, opening the moderation page at `/admin`.

Day-to-day moderation (deleting posts) happens in the app, not in SQL. To change the configured college or its email domain later, update the `colleges` table from the SQL Editor.

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
│   ├── migration_v2.sql   # college verification, likes, tightened RLS — run second
│   ├── migration_v3.sql   # email-only signup (no College ID) — run third
│   ├── migration_v4.sql   # instant activation + admin moderation — run fourth
│   ├── migration_v5.sql   # guest accounts (is_guest flag) — run fifth
│   └── migration_v6.sql   # signup-trigger hardening: domain check on every email signup — run sixth
├── scripts/
│   └── verify_backend.py  # API checks for the v1 rules (auth/RLS/storage)
├── .github/workflows/     # GitHub Pages deployment
└── .env.example           # required environment variables (placeholders only)
```

## Testing

Verified during development: TypeScript typecheck and the production build pass; the SQL migration is verified by querying the live project structure (tables, columns, policies, triggers) after running it.

Honest notes:

- End-to-end tests of the full signup → email confirmation → posting flow require a real email inbox, so they are done manually against the deployed site after setup.
- `scripts/verify_backend.py` covers the v1 API surface (signup/login, RLS impersonation blocks, storage rules). It predates the v2 verification rules.

## Current limitations

- One college is configured (the schema allows more later, the UI assumes one).
- There is no official college database/API to check student identity automatically. Membership relies on the college email domain plus email confirmation; content problems are handled by admin moderation (delete any post).
- Supabase's built-in free email sending has low rate limits, which can slow down confirmation/reset emails when many students sign up at once.
- Like counts are computed in the browser from the `likes` table (fine at campus scale).
- The live site runs the version on `main`; newer work lands on feature branches first and is merged after review.

## Author

**Arvind Kushwaha** — B.Tech (AI & ML) student at Raj Kumar Goel Institute of Technology (RKGIT), Ghaziabad. Campora is a personal learning project being built step by step alongside my studies.
