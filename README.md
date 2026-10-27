# Campora

**Your campus, in one feed.**

Campora is a campus-based social media web app for college students — a place to share
campus updates and photos, follow what is happening around the college, and keep up with
events. It is a personal learning project, built step by step.

> **Status: Work in Progress.** The interface and core interactions below are implemented
> and working. There is no real backend, login, or database yet — see
> [What is implemented vs planned](#what-is-implemented-vs-planned).

**Live demo:** https://arvindkushwaha55.github.io/campora/

## Tech stack

| Part        | Technology                                   |
| ----------- | -------------------------------------------- |
| Framework   | Next.js 15 (App Router) + React 19           |
| Language    | TypeScript                                   |
| Styling     | Tailwind CSS v4                              |
| Data (now)  | Sample data in the app + browser localStorage |
| Data (next) | Supabase (auth + database) — planned         |
| Hosting     | GitHub Pages (static export) · Vercel-ready  |

## Features in this build

- **App shell** — sidebar navigation on desktop, top bar + bottom navigation on mobile
- **Campus feed** — sample posts with campus "spots" (Library, Canteen, Main Block,
  Sports Ground, Auditorium, Hostel), sortable Latest / Popular, filterable by spot
- **Post composer** — write a post, pick a spot, basic validation; your posts are saved
  in the browser and survive a refresh
- **Likes & comments** — like posts and discuss them; state persists on your device
- **Events** — upcoming campus events with a details view and an "Interested" button
- **Campus Pulse** — a small summary calculated live from the posts on the page
  (clearly demo data, not real traffic)
- **Profiles** — student profiles with their posts; follow/unfollow for sample profiles
- **Search** — across posts, events and campus spots, with type filters
- **Report** — report a post (stored locally for now; see limitations)

All sample posts, events, profiles and counts are **sample data for demonstration** —
they are labelled as such inside the app.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

Production build (static export into `out/`):

```bash
npm run build
```

## What is implemented vs planned

**Implemented (working today)**

- Next.js + TypeScript + Tailwind project structure
- Feed, composer, likes, comments, events, profiles, search, report UI
- Demo persistence with `localStorage` through a small data layer (`src/lib/store.ts`),
  so swapping in a real API later does not mean rewriting the screens
- Static export build; deployed to GitHub Pages by a GitHub Actions workflow

**Planned (not built yet)**

- Supabase: real sign-up/login, database-backed posts/events, image uploads
- Real moderation for reports, notifications, direct messages
- Vercel deployment

## Data & persistence — honestly

There is **no server and no database** in this phase. Sample content lives in
`src/lib/data.ts`. Anything you do (post, like, comment, follow, mark interested) is
stored only in your own browser's `localStorage` on this device and can be cleared by
the browser at any time. Nothing is sent anywhere.

## Project structure

```
src/
  app/          layout + main page
  components/   shell (sidebar/mobile nav), feed, panels (events, search, profiles)
  lib/          data.ts (sample data), store.ts (localStorage data layer)
legacy-static-v1/   the earlier plain HTML/CSS/JS prototype (kept for history)
.github/workflows/  GitHub Pages deployment
```

## Deployment

**GitHub Pages (current):** pushes to `main` run `.github/workflows/deploy-pages.yml`,
which builds the static export (with the `/campora` base path) and deploys it.

**Vercel (optional, not set up yet):** import this repository in Vercel — it detects
Next.js automatically. For a fully dynamic deployment later (once a backend exists),
remove the static-export setting; no other code changes are expected. Do not commit
real secrets — copy `.env.example` to `.env.local` for local Supabase keys.

## Author

Built by **Arvind Kushwaha** — B.Tech (AI & ML) student.
GitHub: [@arvindkushwaha55](https://github.com/arvindkushwaha55)

## Notes

Campora is a learning project under active development. Feedback and ideas are welcome
via GitHub issues.
