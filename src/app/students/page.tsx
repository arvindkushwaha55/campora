"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { COURSES, YEARS, cardClass, type Profile } from "@/lib/constants";
import { AppShell } from "@/components/shell";
import { AuthGate, LoadingScreen, inputClass } from "@/components/common";
import { ProfileAvatar, SearchIcon } from "@/components/icons";

/**
 * Student discovery: search verified students of the college by name and
 * filter by course / year. Only approved profiles are returned (the
 * database also enforces this with RLS).
 */
export default function StudentsPage() {
  return (
    <AuthGate>
      <AppShell>
        <Discovery />
      </AppShell>
    </AuthGate>
  );
}

function Discovery() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce the name search so typing does not fire a database query on
  // every keystroke; filters still apply immediately.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) return;
      setLoading(true);
      setError("");
      let q = supabase
        .from("profiles")
        .select("id, full_name, course, year, avatar_url, bio, verification_status, is_admin, is_guest, created_at")
        .eq("verification_status", "approved")
        .order("full_name", { ascending: true })
        .limit(100);
      const term = debouncedQuery.trim();
      if (term) q = q.ilike("full_name", `%${term}%`);
      if (course) q = q.eq("course", course);
      if (year) q = q.eq("year", year);
      const { data, error: loadError } = await q;
      if (!active) return;
      if (loadError) setError("Could not load students. Please try again.");
      else setStudents((data as Profile[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [debouncedQuery, course, year]);

  const others = students.filter((s) => s.id !== user?.id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Discover students</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Verified students of your college. Search by name, or filter by course and year.
        </p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            aria-label="Search students by name"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          aria-label="Filter by course"
          className={`${inputClass} sm:w-44`}
        >
          <option value="">All courses</option>
          {COURSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Filter by year"
          className={`${inputClass} sm:w-40`}
        >
          <option value="">All years</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y} year</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingScreen label="Loading students" />
      ) : error ? (
        <p role="alert" className="rounded-3xl border border-dashed border-red-200 bg-white dark:bg-slate-900 px-4 py-8 text-center text-sm text-red-600">
          {error}
        </p>
      ) : others.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-10 text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-200">No students found</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {query || course || year
              ? "Try a different search or clear the filters."
              : "No other verified students yet — invite your classmates to join."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {others.map((s) => (
            <li key={s.id}>
              <Link
                href={`/profile?id=${s.id}`}
                className={`flex items-center gap-3.5 ${cardClass} p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <span className="shrink-0 rounded-full ring-2 ring-pink-100 dark:ring-pink-500/25">
                  <ProfileAvatar name={s.full_name} avatarUrl={s.avatar_url} size="lg" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900 dark:text-slate-50">{s.full_name}</span>
                  <span className="block text-sm text-slate-500 dark:text-slate-400">
                    {s.is_guest ? "Guest" : `${s.course} · ${s.year} year`}
                  </span>
                  {s.bio && <span className="mt-0.5 block truncate text-sm text-slate-400 dark:text-slate-500">{s.bio}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
