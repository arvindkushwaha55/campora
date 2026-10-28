"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { HomeIcon, LogOutIcon, ProfileAvatar, UserIcon } from "./icons";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-200 text-xl font-black text-rose-900 shadow-sm">
        C
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-black tracking-tight">Campora</span>
        <span className="block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
          Your campus, connected
        </span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/profile", label: "My Profile", Icon: UserIcon },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-900/5 hover:text-stone-900"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

function UserCard() {
  const { profile, session } = useAuth();
  if (!session) return null;
  const name = profile?.full_name ?? session.user.email ?? "Student";
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-stone-900/[0.04] p-3">
      <ProfileAvatar name={name} avatarUrl={profile?.avatar_url} />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="truncate text-xs text-stone-500">
          {profile ? `${profile.course} · ${profile.year} year` : session.user.email}
        </p>
      </div>
    </div>
  );
}

function LogOutButton({ className = "" }: { className?: string }) {
  const { signOut } = useAuth();
  const router = useRouter();
  return (
    <button
      type="button"
      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-rose-50 hover:text-rose-700 ${className}`}
      onClick={async () => {
        await signOut();
        router.replace("/login");
      }}
    >
      <LogOutIcon className="h-5 w-5" />
      Log out
    </button>
  );
}

/**
 * The app frame: sidebar on desktop, top bar + bottom tab bar on mobile.
 * Auth pages (/login, /signup) render without the frame — see AppShell.
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col lg:max-w-6xl lg:flex-row lg:gap-8 lg:px-6">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 py-6 lg:flex">
        <Brand />
        <nav className="flex flex-col gap-1.5">
          <NavLinks />
          <LogOutButton />
        </nav>
        <div className="mt-auto">
          <UserCard />
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-stone-900/5 bg-[#fdf7f2]/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-stone-900/10 bg-white/95 px-2 py-1.5 backdrop-blur lg:hidden">
        {NAV.map(({ href, label, Icon }) => (
          <MobileTab key={href} href={href} label={label} Icon={Icon} />
        ))}
        <MobileLogout />
      </nav>
    </div>
  );
}

function MobileTab({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: typeof HomeIcon;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold ${
        active ? "text-indigo-700" : "text-stone-500"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

function MobileLogout() {
  const { signOut } = useAuth();
  const router = useRouter();
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold text-stone-500"
      onClick={async () => {
        await signOut();
        router.replace("/login");
      }}
    >
      <LogOutIcon className="h-5 w-5" />
      Log out
    </button>
  );
}

/** Pages opt out of the frame by rendering without AppShell (login/signup). */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/signup") return <>{children}</>;
  return <Shell>{children}</Shell>;
}
