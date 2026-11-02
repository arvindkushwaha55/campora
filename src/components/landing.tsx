"use client";

import Link from "next/link";
import { useCollege } from "./common";
import { Brand } from "./shell";
import { CheckIcon, HeartIcon, HomeIcon, SearchIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

// Real photos of the campus, served from Campora's public post-images
// bucket (the same photos students see on the live feed).
const PHOTO_BASE =
  "https://lxkksfpqxmuqynucoguz.supabase.co/storage/v1/object/public/post-images";

function Initials({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${className}`}
    >
      {initials}
    </span>
  );
}

/**
 * A faithful preview of the real Campora feed, built with the same cards
 * and real campus photos — shown inside a browser frame in the hero.
 */
function ProductPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-pink-300/40 via-indigo-300/30 to-violet-300/40 blur-2xl dark:from-pink-500/15 dark:via-indigo-500/15 dark:to-violet-500/15"
      />
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/15">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 flex-1 truncate rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
            arvindkushwaha55.github.io/campora
          </span>
        </div>
        <div className="flex flex-col gap-3 bg-slate-50/80 dark:bg-slate-950/40 p-4">
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5">
            <Initials initials="AK" className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px]" />
            <span className="text-[13px] text-slate-400 dark:text-slate-500">Share something about campus today...</span>
          </div>
          <article className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2.5">
              <Initials initials="AK" className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-violet-500 text-xs" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-50">Arvind Kushwaha</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">B.Tech · 2nd year</p>
              </div>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
              E-Block on a clear morning. Our campus looking its best today.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${PHOTO_BASE}/eblock.png`}
              alt="E-Block building on the RKGIT campus"
              className="mt-3 h-44 w-full rounded-xl object-cover"
              loading="lazy"
            />
            <p className="mt-3 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5 text-xs font-semibold text-rose-600">
              <HeartIcon className="h-4 w-4" fill="currentColor" /> 3 Likes
            </p>
          </article>
          <article className="flex items-center gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${PHOTO_BASE}/campus.png`}
              alt="The campus right after rain"
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-50">Priya Sharma</p>
              <p className="truncate text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Our campus right after the rain — everything looks fresh.
              </p>
            </div>
          </article>
        </div>
      </div>
      <div
        className="absolute -left-3 top-24 flex animate-[floaty_5s_ease-in-out_infinite] items-center gap-2 rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-3 py-2 shadow-lg backdrop-blur sm:-left-6"
        aria-hidden="true"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 dark:bg-emerald-400/15 text-emerald-600">
          <CheckIcon className="h-4 w-4" />
        </span>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Verified students only</span>
      </div>
      <div
        className="absolute -right-2 bottom-20 flex animate-[floaty_6s_ease-in-out_infinite] items-center gap-2 rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-3 py-2 shadow-lg backdrop-blur sm:-right-4"
        style={{ animationDelay: "1.4s" }}
        aria-hidden="true"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-100 dark:bg-rose-400/15 text-rose-600">
          <HeartIcon className="h-4 w-4" fill="currentColor" />
        </span>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Real campus moments</span>
      </div>
    </div>
  );
}

/**
 * Public landing page shown to signed-out visitors. Campora is
 * college-exclusive: only verified students of the configured college
 * can join, so the page explains the verification up front.
 */
export function Landing() {
  const college = useCollege();

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[6%] h-80 w-80 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-32 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/10"
      />

      <header className="sticky top-0 z-30 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/75 dark:bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex" aria-label="Sections">
            <a href="#features" className="transition-colors hover:text-slate-900 dark:hover:text-white">Features</a>
            <a href="#campus" className="transition-colors hover:text-slate-900 dark:hover:text-white">Campus life</a>
            <a href="#how" className="transition-colors hover:text-slate-900 dark:hover:text-white">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="hidden rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:from-indigo-700 hover:to-violet-700 active:scale-95 sm:block"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="grid items-center gap-12 pb-8 pt-12 sm:pt-16 lg:grid-cols-[1.02fr_1fr]">
          <div className="text-center lg:text-left">
            {college && (
              <span className="inline-block rounded-full bg-indigo-50 dark:bg-indigo-400/10 px-3.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-400/20">
                Exclusively for students of {college.name}
              </span>
            )}
            <h1 className="mt-5 text-[42px] font-extrabold leading-[1.05] tracking-tight text-slate-900 dark:text-slate-50 sm:text-6xl">
              Your campus,{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-rose-400">
                connected.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg lg:mx-0">
              Campora is a private social space for your college — share campus
              updates and photos, find your classmates, and stay in the loop.
              Only verified students get in.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-700 hover:to-violet-700 active:scale-95"
              >
                Create your account
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-7 py-3.5 text-[15px] font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                I already have an account
              </Link>
            </div>
            <div className="mt-9 flex items-center justify-center gap-3 lg:justify-start">
              <span className="flex -space-x-2.5">
                <Initials initials="PS" className="h-9 w-9 bg-gradient-to-br from-pink-500 to-rose-500 text-[11px] ring-2 ring-white dark:ring-slate-950" />
                <Initials initials="RV" className="h-9 w-9 bg-gradient-to-br from-sky-500 to-indigo-500 text-[11px] ring-2 ring-white dark:ring-slate-950" />
                <Initials initials="AK" className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] ring-2 ring-white dark:ring-slate-950" />
              </span>
              <p className="text-left text-[13px] leading-snug text-slate-500 dark:text-slate-400">
                Made for your classmates.
                <span className="block font-semibold text-slate-700 dark:text-slate-200">Every account is admin-verified.</span>
              </p>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section id="features" className="scroll-mt-24 pb-4 pt-16">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            Why Campora
          </p>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Built for one campus community
          </h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 hover:shadow-xl">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/25">
                <CheckIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-50">Verified students only</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Sign up with your college email and confirm it — only students
                of your college can get in, and the admin removes anything
                that does not belong.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 hover:shadow-xl">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25">
                <HomeIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-50">One campus feed</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Post updates and photos from campus life and see what other
                students are sharing, newest first.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 hover:shadow-xl">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25">
                <SearchIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-50">Find your people</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Search students by name and filter by course or year to discover
                classmates across the campus.
              </p>
            </div>
          </div>
        </section>

        <section id="campus" className="scroll-mt-24 pt-16">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.18em] text-rose-500 dark:text-rose-400">
            Campus life
          </p>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Moments from around RKGIT
          </h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              { img: "canteen.png", alt: "Lunch thali at the college canteen", caption: "Canteen chronicles" },
              { img: "stadium.png", alt: "The college football ground and stands", caption: "Match days at the ground" },
              { img: "campus.png", alt: "Campus lawn and fountain right after rain", caption: "The campus, after the rain" },
            ].map((photo) => (
              <figure key={photo.img} className="group relative overflow-hidden rounded-3xl shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${PHOTO_BASE}/${photo.img}`}
                  alt={photo.alt}
                  className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent px-5 pb-4 pt-14 text-[15px] font-bold text-white">
                  {photo.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-24 pt-16">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            How joining works
          </h2>
          <div className="mx-auto mt-9 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Sign up", d: "Use your college email, course and year." },
              { n: "2", t: "Get verified", d: "Confirm your email from the link we send you." },
              { n: "3", t: "Join the feed", d: "Your account unlocks — post, like and discover students." },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)]"
              >
                <span className="bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-4xl font-extrabold text-transparent">
                  {s.n}
                </span>
                <h3 className="mt-2.5 font-bold text-slate-900 dark:text-slate-50">{s.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-20 pt-16">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-600 via-violet-600 to-rose-500 px-6 py-12 text-center shadow-xl shadow-indigo-600/25 sm:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-pink-300/25 blur-2xl"
            />
            <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Your campus is waiting.
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/85">
              Create your account with your college email and join your
              classmates on Campora.
            </p>
            <Link
              href="/signup"
              className="relative mt-7 inline-block rounded-full bg-white px-8 py-3.5 text-[15px] font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 active:scale-95"
            >
              Create your account
            </Link>
            {college && (
              <p className="relative mt-4 text-xs font-medium text-white/70">
                Only @{college.email_domain} college emails can join.
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="relative border-t border-slate-200/70 dark:border-slate-800/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-9 text-center sm:px-6">
          <Brand />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-500 dark:text-slate-400" aria-label="Footer">
            <a href="#features" className="transition-colors hover:text-slate-900 dark:hover:text-white">Features</a>
            <a href="#campus" className="transition-colors hover:text-slate-900 dark:hover:text-white">Campus life</a>
            <a href="#how" className="transition-colors hover:text-slate-900 dark:hover:text-white">How it works</a>
            <Link href="/login" className="transition-colors hover:text-slate-900 dark:hover:text-white">Log in</Link>
            <Link href="/signup" className="transition-colors hover:text-slate-900 dark:hover:text-white">Create account</Link>
          </nav>
          <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
            Campora — a personal mini project by Arvind Kushwaha, Work in Progress.
            {college ? ` Made for the students of ${college.name}.` : ""}
          </p>
        </div>
      </footer>
    </div>
  );
}
