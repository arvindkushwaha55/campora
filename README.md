# Campora

> **Status: Work in Progress** — Early-stage personal project. The current version is a static frontend prototype with sample data only.

## Overview

Campora is a campus-based social media web app for college students. It is designed to help students share photos and daily campus updates, and stay informed about college events, activities, and happenings — all in one place, focused only on their campus.

## Purpose

College updates are usually scattered across notice boards, group chats, and different social apps. Campora explores a single, campus-focused feed where students can:

- See what is happening around their campus
- Share everyday moments and updates with fellow students
- Discover college events and activities in time to join them

## Current State

What exists right now:

- A clean, responsive homepage built with plain HTML, CSS, and JavaScript
- Campora branding and a navigation bar
- A campus social feed with sample posts
- A basic post creation box (posts are added to the feed on the page only — nothing is saved)
- A campus events section with sample event updates

What does **not** exist yet:

- No user accounts or authentication
- No backend or database — all data is static sample data in the browser
- No photo upload, comments system, or real-time updates

## Planned Features

- [ ] User profiles for students
- [ ] Photo and post sharing
- [ ] Campus event listings with dates and venues
- [ ] Comments and reactions on posts
- [ ] Backend and database for persistent data
- [ ] Authentication for verified students

These are plans, not completed features.

## Tech Stack

- HTML5
- CSS3 (responsive layout, no framework)
- Vanilla JavaScript

No build tools or dependencies — just open the page in a browser.

## Getting Started

```bash
git clone <this-repo-url>
cd campora
# Open index.html in a browser, or serve it locally:
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Project Structure

```
campora/
├── index.html   # Homepage — nav, feed, post composer, events
├── styles.css   # All styling, responsive layout
├── script.js    # Sample data rendering, like buttons, local post composer
└── README.md
```

## Author

**Arvind Kushwaha** — B.Tech (AI & ML) student at Raj Kumar Goel Institute of Technology (RKGIT), Ghaziabad.

Campora is a personal learning project being built step by step alongside my studies.
