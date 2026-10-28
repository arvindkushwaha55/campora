"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { CameraIcon, ProfileAvatar } from "./icons";
import { AppShell } from "./shell";

/** Shared Tailwind classes for form fields. */
export const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
export const labelCls = "mb-1.5 block text-sm font-semibold";

/** Shown instead of the app when the Supabase env keys are missing. */
export function NotConfigured() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-200 text-2xl font-black text-rose-900">
        C
      </span>
      <h1 className="mt-4 text-xl font-black tracking-tight">Campora is not connected yet</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        The Supabase keys are missing, so accounts and posts cannot load. Add{" "}
        <code className="rounded bg-stone-900/5 px-1 py-0.5 text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        and{" "}
        <code className="rounded bg-stone-900/5 px-1 py-0.5 text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        to <code className="rounded bg-stone-900/5 px-1 py-0.5 text-[13px]">.env.local</code> (see{" "}
        <code className="rounded bg-stone-900/5 px-1 py-0.5 text-[13px]">.env.example</code> and the README),
        then restart the app.
      </p>
    </main>
  );
}

export function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm font-medium text-stone-500">Loading Campora…</p>
    </main>
  );
}

/**
 * Wraps a signed-in-only page: shows a loader while the session is checked,
 * and sends signed-out visitors to /login. Renders NotConfigured when the
 * backend keys are absent (no fake data is ever shown).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isSupabaseConfigured && !session) router.replace("/login");
  }, [loading, session, router]);

  if (!isSupabaseConfigured) return <NotConfigured />;
  if (loading) return <LoadingScreen />;
  if (!session) return <LoadingScreen />;
  return <>{children}</>;
}

/** Centered card used by the login and signup pages (rendered without the shell). */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-200 text-2xl font-black text-rose-900 shadow-sm">
          C
        </span>
        <h1 className="mt-3 text-2xl font-black tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      </div>
      <div className="rounded-3xl border border-stone-900/5 bg-white p-6 shadow-sm">{children}</div>
      {footer && <p className="mt-5 text-center text-sm text-stone-600">{footer}</p>}
      <p className="mt-8 text-center text-xs text-stone-400">
        <Link href="/" className="font-semibold hover:underline">
          Campora
        </Link>{" "}
        · Your campus, connected
      </p>
    </main>
  );
}

/**
 * Profile picture picker with a live preview: shows the newly picked file,
 * or the current picture, or initials. Used by signup and profile edit.
 */
export function ProfileAvatarInput({
  name,
  currentUrl,
  file,
  onChange,
}: {
  name: string;
  currentUrl?: string | null;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;
  return (
    <div className="flex items-center gap-4">
      <ProfileAvatar
        name={name}
        avatarUrl={previewUrl ?? currentUrl ?? null}
        className="h-16 w-16 text-base"
      />
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl bg-stone-900/5 px-3.5 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-900/10"
        >
          <CameraIcon className="h-4.5 w-4.5" />
          {file || currentUrl ? "Change photo" : "Add photo"}
        </button>
        <p className="mt-1.5 text-xs text-stone-500">Optional · JPG/PNG · max 5 MB</p>
        {file && <p className="mt-0.5 max-w-56 truncate text-xs font-medium text-stone-600">{file.name}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

/** Home feed page frame: shell + auth gate in one place. */
export function Framed({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <AuthGate>{children}</AuthGate>
    </AppShell>
  );
}
