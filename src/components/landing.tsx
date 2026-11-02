"use client";

import Link from "next/link";
import { useCollege } from "./common";
import { Brand } from "./shell";
import { CheckIcon, HomeIcon, SearchIcon, UserIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

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
      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
        <section className="flex flex-col items-center pt-10 text-center sm:pt-16">
          <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-br from-pink-200 to-rose-300 shadow-sm ring-1 ring-rose-900/10 text-3xl font-extrabold text-rose-900 shadow-sm">
            C
          </span>
          {college && (
            <span className="mt-5 rounded-full bg-indigo-50 dark:bg-indigo-400/10 px-3.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Exclusively for students of {college.name}
            </span>
          )}
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            Your campus,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-rose-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-rose-400">
              connected.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg">
            Campora is a private social space for your college — share campus
            updates and photos, find your classmates, and stay in the loop.
            Only verified students get in.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition-colors hover:from-indigo-700 hover:to-violet-700"
            >
              Create your account
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 text-[15px] font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-4 pt-14 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600">
              <CheckIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-bold text-slate-900 dark:text-slate-50">Verified students only</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Sign up with your college email and confirm it — only students
              of your college can get in, and the admin removes anything
              that does not belong.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400">
              <HomeIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-bold text-slate-900 dark:text-slate-50">One campus feed</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Post updates and photos from campus life and see what other
              students are sharing, newest first.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-pink-100 dark:bg-pink-400/15 text-rose-600">
              <SearchIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-bold text-slate-900 dark:text-slate-50">Find your people</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Search students by name and filter by course or year to discover
              classmates across the campus.
            </p>
          </div>
        </section>

        <section className="pb-16 pt-8">
          <h2 className="text-center text-lg font-bold text-slate-900 dark:text-slate-50">How joining works</h2>
          <div className="mx-auto mt-5 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              { n: "1", t: "Sign up", d: "Use your college email, course and year." },
              { n: "2", t: "Get verified", d: "Confirm your email from the link we send you." },
              { n: "3", t: "Join the feed", d: "Your account unlocks — post, like and discover students." },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm text-sm font-bold text-white">
                  {s.n}
                </span>
                <span>
                  <span className="block font-semibold text-slate-900 dark:text-slate-50">{s.t}</span>
                  <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{s.d}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-10 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400 dark:text-slate-500">
            <UserIcon className="h-3.5 w-3.5" />
            Campora — a personal mini project, Work in Progress.
          </p>
        </section>
      </main>
    </div>
  );
}
