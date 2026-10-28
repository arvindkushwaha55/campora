# Campora

> **Status: Work in Progress** — A personal mini project in active development. The current version is a frontend application with clearly labelled sample data and browser-only persistence. There are no real accounts and no backend yet.

**Live Demo:** https://arvindkushwaha55.github.io/campora/

## Overview

Campora is a campus-based social networking web app for college students. Students can share campus life — daily updates, happenings, activities — and discover college events, all in one place dedicated to their campus instead of a general-purpose social network.

## The Problem

Campus updates today are scattered across notice boards, class group chats, and general social apps where they get buried. Campora explores one focused feed for a single college community: what is happening, where, and what is coming up.

## Features

### Implemented (frontend, working in the live demo)

- **App shell** — sidebar navigation on desktop, compact top bar and bottom navigation on mobile, fully responsive
- **Campus feed** — sample posts with author, course, timestamp, and campus location (spot); Latest / Popular sorting
- **Campus Spots** — filter the feed by location: Library, Canteen, Main Block, Sports Ground, Auditorium, Hostel
- **Create a post** — text composer with location selection, validation, and character limit; your posts are saved in your browser and stay after refresh
- **Likes and comments** — like/unlike posts, open comment threads, and add comments (saved in your browser)
- **Campus events** — sample events with date, time, location, and category; event details view; "Interested" marking (saved in your browser)
- **Campus Pulse** — most liked post, most discussed post, next event, and most active spot, all calculated from the posts and events actually on the page
- **Student profiles** — profile pages with bio, campus affiliation, and that student's posts (sample profiles are labelled as such)
- **Search** — search across posts, events, and campus spots, with type filters
- **Safety foundations** — report a post (saved on your device, hides the post for you) and delete your own posts

### Not built yet (planned)

- Real accounts and authentication
- A database / backend (Supabase is the planned choice) so posts are shared between users and devices
- Photo uploads
- Real moderation of reported content
- Real-time updates

Nothing in the "planned" list is claimed as working anywhere in this project.

## How Data Works Right Now

Sample posts, events, and profiles live in `src/lib/data.ts` and are labelled "Sample" in the UI wherever practical. Everything you do — posting, liking, commenting, marking interest, reporting — is stored only in your browser's `localStorage` through the data layer in `src/lib/store.ts`. It never leaves your device, and other visitors see their own sample feed, not your posts. The store functions are written behind a small interface so the Supabase phase can replace them without rewriting the UI.

## Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- HTML5 / CSS3
- **Git + GitHub** for version control
- Deployment: **GitHub Pages** (static export, live now) · Vercel-ready (see below)
- Planned: **Supabase** (database + auth) — not yet integrated; see `.env.example`

## Getting Started

```bash
git clone https://github.com/arvindkushwaha55/campora.git
cd campora
npm install
npm run dev
# Open http://localhost:3000
```

Other commands:

```bash
npm run build      # production build (static export into out/)
npm run typecheck  # TypeScript check without emitting files
```

### Environment variables

The current frontend needs **no** environment variables. `.env.example` lists the Supabase variables that a later backend phase will use; they are placeholders only and are not read by the current code. Never commit real secrets.

## Deployment

- **GitHub Pages (current):** every push to `main` runs `.github/workflows/deploy-pages.yml`, which builds the static export with the `/campora` base path and deploys it to the live demo URL above.
- **Vercel (alternative):** import this repository in Vercel, keep the default Next.js settings, and deploy — no environment variables are required for the current version. (Not deployed there yet.)

## Project Structure

```
campora/
├── src/
│   ├── app/          # layout.tsx, page.tsx, globals.css (design tokens)
│   ├── components/   # shell.tsx (nav), feed.tsx (composer, posts, comments),
│   │                 # panels.tsx (events, Campus Pulse, profiles, event details)
│   └── lib/          # data.ts (sample data + types), store.ts (data layer)
├── .github/workflows/  # GitHub Pages deployment
├── legacy-static-v1/   # the first plain HTML/CSS/JS prototype, kept for history
└── .env.example        # placeholder variables for the future Supabase phase
```

## Screenshots

Screenshots will be added once the design settles. The live demo above always shows the current state.

## Current Limitations

- Single-device demo: no accounts, no shared data between users
- Sample content is fictional and labelled as such
- Reports are stored locally only; there is no moderation system yet
- No photo uploads yet

## Author

**Arvind Kushwaha** — B.Tech (AI & ML) student at Raj Kumar Goel Institute of Technology (RKGIT), Ghaziabad. Campora is a personal learning project being built step by step alongside my studies.
