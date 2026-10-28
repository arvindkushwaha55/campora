"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Brand } from "./shell";
import { CameraIcon, ProfileAvatar } from "./icons";

export function NotConfigured() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <Brand />
      <h1 className="mt-2 text-xl font-bold text-slate-900">Campora is not connected yet</h1>
      <p className="max-w-md text-[15px] leading-relaxed text-slate-500">
        The Supabase backend keys are missing, so login and posts cannot work yet. Add{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        and{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        to the environment (see the README setup steps) and reload.
      </p>
    </main>
  );
}

export function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col gap-4" aria-label={label}>
      <div className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70" />
    </div>
  );
}

// Wraps signed-in pages: shows the setup screen when the backend keys are
// missing, a loading state while the session is checked, and sends
// signed-out visitors to /login.
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (!isSupabaseConfigured) return <NotConfigured />;
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <LoadingScreen />
      </div>
    );
  }
  if (!user) return null;
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
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex justify-center">
          <Brand />
        </div>
        <h1 className="mt-5 text-center text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-center text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
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
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-pink-300 hover:text-pink-700"
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
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

export const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
