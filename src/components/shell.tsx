"use client";

import { PROFILES } from "@/lib/data";
import { Avatar, CalendarIcon, HomeIcon, PlusIcon, UserIcon } from "./icons";

export type View = "feed" | "events" | "profile";

const NAV: { key: View; label: string; Icon: typeof HomeIcon }[] = [
  { key: "feed", label: "Home", Icon: HomeIcon },
  { key: "events", label: "Events", Icon: CalendarIcon },
  { key: "profile", label: "My Profile", Icon: UserIcon },
];

export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-indigo-600 text-lg font-extrabold text-white">
        C
      </span>
      <span className="text-[19px] font-extrabold tracking-tight text-slate-900">Campora</span>
    </span>
  );
}

export function Sidebar({
  view,
  onNavigate,
  onCreate,
}: {
  view: View;
  onNavigate: (v: View) => void;
  onCreate: () => void;
}) {
  const me = PROFILES.you;
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
      <Brand />
      <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
        {NAV.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
              view === key
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            aria-current={view === key ? "page" : undefined}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        <PlusIcon className="h-4.5 w-4.5" /> Create Post
      </button>
      <div className="mt-auto">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <Avatar name={me.name} color={me.color} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">{me.name}</span>
            <span className="block truncate text-xs text-slate-500">{me.course}</span>
          </span>
        </div>
        <p className="px-2 pt-2 text-[11px] leading-relaxed text-slate-400">
          Demo build · Sample data · Work in Progress
        </p>
      </div>
    </aside>
  );
}

export function TopBar({ onProfile }: { onProfile: () => void }) {
  const me = PROFILES.you;
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <Brand />
      <button type="button" onClick={onProfile} aria-label="Open my profile" className="rounded-full">
        <Avatar name={me.name} color={me.color} size="sm" />
      </button>
    </header>
  );
}

export function MobileNav({
  view,
  onNavigate,
  onCreate,
}: {
  view: View;
  onNavigate: (v: View) => void;
  onCreate: () => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Mobile"
    >
      {NAV.slice(0, 2).map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onNavigate(key)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
            view === key ? "text-indigo-700" : "text-slate-500"
          }`}
          aria-current={view === key ? "page" : undefined}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
      <button
        type="button"
        onClick={onCreate}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500"
      >
        <PlusIcon className="h-5 w-5" />
        Post
      </button>
      <button
        type="button"
        onClick={() => onNavigate("profile")}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
          view === "profile" ? "text-indigo-700" : "text-slate-500"
        }`}
        aria-current={view === "profile" ? "page" : undefined}
      >
        <UserIcon className="h-5 w-5" />
        Profile
      </button>
    </nav>
  );
}
