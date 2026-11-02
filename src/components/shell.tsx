"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { HomeIcon, LogOutIcon, ProfileAvatar, SearchIcon, ShieldIcon, UserIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-pink-200 to-rose-300 shadow-sm ring-1 ring-rose-900/10 text-lg font-extrabold text-rose-900">
        C
      </span>
      <span className="text-[19px] font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Campora</span>
    </span>
  );
}

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
    active
      ? "bg-indigo-50 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-300"
      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
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
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-5 lg:flex">
      <Brand />
      <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
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
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
        >
          <LogOutIcon className="h-5 w-5" /> Log out
        </button>
      </nav>
      <div className="mt-auto">
        <div className="mb-1 flex items-center justify-between rounded-lg px-2 py-1">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Appearance</span>
          <ThemeToggle />
        </div>
        {profile && (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{profile.full_name}</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {profile.course} · {profile.year} year
              </span>
            </span>
          </div>
        )}
        <p className="px-2 pt-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
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

// Page frame used by the signed-in pages (feed + profile).
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 sm:pt-6 lg:pb-10">
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
