"use client";

import { useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured, siteUrl, supabase } from "@/lib/supabase";
import { AuthCard, NotConfigured, inputClass, labelClass } from "@/components/common";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseConfigured) return <NotConfigured />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: siteUrl("/reset-password"),
    });
    setSubmitting(false);
    if (resetError) {
      setError("Could not send the reset email. Please try again in a little while.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthCard title="Reset your password" subtitle="We will email you a secure reset link.">
      {sent ? (
        <div className="flex flex-col gap-4">
          <p role="status" className="rounded-lg bg-emerald-50 dark:bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
            If an account exists for {email.trim()}, a password reset link is on its way.
            Please check your inbox (and spam folder).
          </p>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            <Link href="/login" className="font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className={labelClass} htmlFor="forgot-email">College email</label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
              className={inputClass}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/20 px-4 py-3 text-[15px] font-semibold text-white transition-all hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
