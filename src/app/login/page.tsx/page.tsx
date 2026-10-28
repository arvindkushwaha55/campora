"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { AuthCard, NotConfigured } from "@/components/common";
import { inputCls } from "@/components/common";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <NotConfigured />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Email or password is wrong. Please check and try again."
          : err.message,
      );
      return;
    }
    router.replace("/");
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to see what your campus is up to."
      footer={
        <>
          New to Campora?{" "}
          <Link href="/signup" className="font-bold text-indigo-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            className={inputCls}
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            className={inputCls}
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthCard>
  );
}
