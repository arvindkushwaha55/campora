"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { College, Profile } from "@/lib/constants";
import { Brand } from "./shell";
import { CameraIcon, ProfileAvatar } from "./icons";
import { ThemeToggle } from "./theme-toggle";

/** Loads the configured college (name + approved email domain), if any. */
export function useCollege(): College | null {
  const [college, setCollege] = useState<College | null>(null);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("colleges")
      .select("id, name, email_domain, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCollege((data as College | null) ?? null);
      });
    return () => {
      active = false;
    };
  }, []);
  return college;
}

export function NotConfigured() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <Brand />
      <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-50">Campora is not connected yet</h1>
      <p className="max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
        The Supabase backend keys are missing, so login and posts cannot work yet. Add{" "}
        <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        and{" "}
        <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        to the environment (see the README setup steps) and reload.
      </p>
    </main>
  );
}

export function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col gap-4" aria-label={label}>
      <div className="h-36 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
    </div>
  );
}

/**
 * Shown to signed-in students whose account is not approved yet (or was
 * rejected). The campus feed stays locked until an admin verifies the
 * student's College ID — this gate is also enforced by the database (RLS),
 * this screen just explains it.
 */
export function VerificationScreen({ profile }: { profile: Profile }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const rejected = profile.verification_status === "rejected";
  const emailConfirmed = Boolean(user?.email_confirmed_at);

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex justify-center">
          <Brand />
        </div>
        <span
          className={`mt-5 inline-block rounded-full px-3 py-1 text-xs font-bold ${
            rejected ? "bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-300" : "bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {rejected ? "Verification not approved" : "Verification pending"}
        </span>
        <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-50">
          {rejected ? "Your account was not approved" : "One more step, " + profile.full_name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {rejected
            ? "An admin reviewed your details and could not verify your College ID. If you think this is a mistake, please contact your faculty admin with your College ID card."
            : "Your account is created. An admin will verify your College ID, and then your campus feed unlocks automatically. This usually happens once the admin reviews new signups."}
        </p>
        {!rejected && (
          <ul className="mt-5 flex flex-col gap-2.5 text-left text-sm">
            <li className="flex items-center gap-2.5">
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${emailConfirmed ? "bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300"}`}>
                {emailConfirmed ? "✓" : "1"}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {emailConfirmed ? "Email verified" : "Confirm your email from the link we sent you"}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-100 dark:bg-amber-400/20 text-[11px] font-bold text-amber-700 dark:text-amber-300">2</span>
              <span className="text-slate-600 dark:text-slate-300">Admin verifies your College ID ({profile.course} · {profile.year} year)</span>
            </li>
          </ul>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Log out
        </button>
      </div>
    </main>
  );
}

// Wraps signed-in pages: shows the setup screen when the backend keys are
// missing, a loading state while the session is checked, sends signed-out
// visitors to /login, and keeps unverified students on the verification
// screen until an admin approves their College ID.
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (!isSupabaseConfigured) return <NotConfigured />;
  if (loading || (user && !profile)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <LoadingScreen />
      </div>
    );
  }
  if (!user) return null;
  if (profile && !profile.is_admin && profile.verification_status !== "approved") {
    return <VerificationScreen profile={profile} />;
  }
  return <>{children}</>;
}

// Centered card layout for the login and signup pages.
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex justify-center">
          <Brand />
        </div>
        <h1 className="mt-5 text-center text-xl font-bold text-slate-900 dark:text-slate-50">{title}</h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Campora — a personal mini project, Work in Progress.
      </p>
    </main>
  );
}

// Optional profile-picture picker used by signup and profile editing:
// a round preview plus a file button. The parent owns the selected File.
export function ProfileAvatarInput({
  preview,
  name,
  onPick,
}: {
  preview: string;
  name: string;
  onPick: (file: File | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className={labelClass}>Profile picture (optional)</span>
      <div className="flex items-center gap-3">
        <span className="relative inline-block">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <ProfileAvatar name={name} size="lg" />
          )}
        </span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-pink-300 hover:text-pink-700"
        >
          <CameraIcon className="h-4.5 w-4.5" /> {preview ? "Change photo" : "Add photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-[15px] text-slate-900 dark:text-slate-50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

export const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200";
