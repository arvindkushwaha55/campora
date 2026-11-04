"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AuthCard, NotConfigured, PasswordInput, labelClass } from "@/components/common";

/**
 * Landing page for the password-reset email link. Supabase puts a short-lived
 * recovery session in the URL; supabase-js picks it up automatically. Only
 * with that session can the password be changed here.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        setHasSession(true);
        setReady(true);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) return <NotConfigured />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError("Could not update the password. The reset link may have expired — please request a new one.");
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => router.replace("/login"), 1500);
  }

  return (
    <AuthCard title="Set a new password" subtitle="Choose a new password for your Campora account.">
      {!ready ? (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">Checking your reset link...</p>
      ) : done ? (
        <p role="status" className="rounded-lg bg-emerald-50 dark:bg-emerald-400/10 px-3 py-2.5 text-center text-sm text-emerald-700 dark:text-emerald-300">
          Password updated. Taking you to the login page...
        </p>
      ) : !hasSession ? (
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            This page only works from a fresh password-reset email link. Your link
            may have expired or already been used.
          </p>
          <Link href="/forgot-password" className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className={labelClass} htmlFor="reset-password">New password</label>
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="reset-confirm">Confirm new password</label>
            <PasswordInput
              id="reset-confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Type it again"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-indigo-600 shadow-md shadow-indigo-600/25 px-4 py-3 text-[15px] font-semibold text-white transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
