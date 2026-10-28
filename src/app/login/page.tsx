"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { AuthCard, NotConfigured, inputClass, labelClass } from "@/components/common";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  if (!isSupabaseConfigured) return <NotConfigured />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("invalid")
          ? "Email or password is wrong. Please check and try again."
          : "Could not log in. Please try again."
      );
      return;
    }
    router.replace("/");
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to your Campora account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className={inputClass}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        New to Campora?{" "}
        <Link href="/signup" className="font-semibold text-indigo-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
