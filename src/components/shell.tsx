"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { cardClass, type College, type Profile } from "@/lib/constants";
import { ArrowUpIcon, CheckIcon, HomeIcon, LogOutIcon, ProfileAvatar, SearchIcon, ShieldIcon, SparkleIcon, UserIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-slate-900 dark:bg-slate-50 font-display text-xl font-black italic text-white shadow-sm dark:text-slate-900">
        C
      </span>
      <span className="font-display text-[21px] font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Campora<span className="text-rose-500">.</span>
      </span>
    </span>
  );
}

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold transition-all ${
    active
      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
      : "font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
  }`;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 py-5 backdrop-blur lg:flex">
      <Brand />
      <p className="mt-8 px-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        Menu
      </p>
      <nav className="mt-2 flex flex-col gap-1" aria-label="Main">
        <Link href="/" className={navClass(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
          <HomeIcon className="h-5 w-5" /> Home
        </Link>
        <Link
          href="/students"
          className={navClass(pathname.startsWith("/students"))}
          aria-current={pathname.startsWith("/students") ? "page" : undefined}
        >
          <SearchIcon className="h-5 w-5" /> Students
        </Link>
        <Link
          href="/profile"
          className={navClass(pathname.startsWith("/profile"))}
          aria-current={pathname.startsWith("/profile") ? "page" : undefined}
        >
          <UserIcon className="h-5 w-5" /> My Profile
        </Link>
        {profile?.is_admin && (
          <Link
            href="/admin"
            className={navClass(pathname.startsWith("/admin"))}
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
          >
            <ShieldIcon className="h-5 w-5" /> Admin
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
        >
          <LogOutIcon className="h-5 w-5" /> Log out
        </button>
      </nav>
      <div className="mt-auto">
        <div className="mb-2 flex items-center justify-between rounded-lg px-2 py-1">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Appearance</span>
          <ThemeToggle />
        </div>
        {profile && (
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{profile.full_name}</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {profile.is_guest ? "Guest" : `${profile.course} · ${profile.year} year`}
              </span>
            </span>
          </Link>
        )}
        <p className="px-2 pt-2.5 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          Campora · Work in Progress
        </p>
      </div>
    </aside>
  );
}

export function TopBar() {
  const { profile } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-3 backdrop-blur lg:hidden">
      <Brand />
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        {profile && (
          <Link href="/profile" aria-label="Open my profile" className="rounded-full">
            <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} size="sm" />
          </Link>
        )}
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  const item = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
      active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Mobile"
    >
      <Link href="/" className={item(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
        <HomeIcon className="h-5 w-5" /> Home
      </Link>
      <Link
        href="/students"
        className={item(pathname.startsWith("/students"))}
        aria-current={pathname.startsWith("/students") ? "page" : undefined}
      >
        <SearchIcon className="h-5 w-5" /> Students
      </Link>
      <Link
        href="/profile"
        className={item(pathname.startsWith("/profile"))}
        aria-current={pathname.startsWith("/profile") ? "page" : undefined}
      >
        <UserIcon className="h-5 w-5" /> Profile
      </Link>
      {profile?.is_admin && (
        <Link
          href="/admin"
          className={item(pathname.startsWith("/admin"))}
          aria-current={pathname.startsWith("/admin") ? "page" : undefined}
        >
          <ShieldIcon className="h-5 w-5" /> Admin
        </Link>
      )}
      <button type="button" onClick={handleLogout} className={item(false)}>
        <LogOutIcon className="h-5 w-5" /> Log out
      </button>
    </nav>
  );
}

/**
 * Right-hand discovery rail shown beside the feed on wide screens.
 * Everything here is real data: the configured college and the newest
 * verified students (the same profiles the Students page lists).
 */
export function RightRail() {
  const { user } = useAuth();
  const [college, setCollege] = useState<College | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    (async () => {
      const [collegeRes, studentsRes] = await Promise.all([
        supabase
          .from("colleges")
          .select("id, name, email_domain, is_active")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, full_name, course, year, avatar_url, bio, verification_status, is_admin, is_guest, created_at")
          .eq("verification_status", "approved")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      if (!active) return;
      setCollege((collegeRes.data as College | null) ?? null);
      const rows = ((studentsRes.data as Profile[]) ?? []).filter((s) => s.id !== user?.id);
      setStudents(rows.slice(0, 4));
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6 xl:flex" aria-label="Discover">
      <section className="band-ink overflow-hidden rounded-3xl p-5 text-white shadow-lg">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/70">
          <SparkleIcon className="h-4 w-4" /> Your campus, only
        </p>
        <h2 className="mt-2 font-display text-[21px] font-bold leading-snug">
          {college ? college.name : "Your college"}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/85">
          Every account here is a verified student — college email, confirmed by email link.
        </p>
        {college && (
          <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <CheckIcon className="h-3.5 w-3.5" /> @{college.email_domain} only
          </span>
        )}
      </section>

      <section className={`${cardClass} p-5`}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">New students</h2>
          <Link href="/students" className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-300 hover:underline">
            View all
          </Link>
        </div>
        {students.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            No classmates here yet — invite yours to join Campora.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col">
            {students.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/profile?id=${s.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ProfileAvatar name={s.full_name} avatarUrl={s.avatar_url} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{s.full_name}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {s.is_guest ? "Guest" : `${s.course} · ${s.year} year`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="px-1 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        Campora is a private space for one college community — nothing here is visible outside.
      </p>
    </aside>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-24 right-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white lg:bottom-6 lg:right-6"
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUpIcon className="h-5 w-5" />
    </button>
  );
}

// Page frame used by the signed-in pages (feed + profile). With `rail`,
// wide screens get the discovery rail beside a narrower centre column.
export function AppShell({ children, rail = false }: { children: React.ReactNode; rail?: boolean }) {
  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 dark:bg-slate-50 dark:text-slate-900"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          id="main-content"
          tabIndex={-1}
          className={`mx-auto w-full flex-1 px-4 pb-24 pt-4 outline-none sm:pt-6 lg:pb-10 ${
            rail ? "max-w-2xl" : "max-w-3xl"
          }`}
        >
          {children}
        </main>
      </div>
      {rail && <RightRail />}
      <MobileNav />
      <BackToTop />
    </div>
  );
}
