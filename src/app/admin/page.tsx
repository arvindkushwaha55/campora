"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { Profile } from "@/lib/constants";
import { AppShell } from "@/components/shell";
import { AuthGate, LoadingScreen } from "@/components/common";
import { ProfileAvatar, ShieldIcon } from "@/components/icons";

/**
 * Admin verification desk. Only accounts with profiles.is_admin = true see
 * the pending list — and the database enforces the same rule (RLS + a
 * trigger), so this page alone cannot be used to approve anyone.
 * Admins are appointed manually in Supabase (see README → Admin setup).
 */
export default function AdminPage() {
  return (
    <AuthGate>
      <AppShell>
        <AdminDesk />
      </AppShell>
    </AuthGate>
  );
}

type PendingStudent = Profile;

function AdminDesk() {
  const { profile } = useAuth();
  const [pending, setPending] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decided, setDecided] = useState(0);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError("");
    const { data, error: loadError } = await supabase
      .from("profiles")
      .select("id, full_name, course, year, avatar_url, bio, verification_status, is_admin, created_at")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true });
    if (loadError) {
      setError("Could not load verification requests.");
      setLoading(false);
      return;
    }
    setPending((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (profile?.is_admin) void load();
    else setLoading(false);
  }, [profile?.is_admin, load]);

  async function decide(student: PendingStudent, status: "approved" | "rejected") {
    if (!supabase) return;
    setBusyId(student.id);
    setError("");
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ verification_status: status })
      .eq("id", student.id);
    setBusyId(null);
    if (updateError) {
      setError("Could not save that decision. Please try again.");
      return;
    }
    setPending((prev) => prev.filter((p) => p.id !== student.id));
    setDecided((n) => n + 1);
  }

  if (!profile?.is_admin) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-12 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ShieldIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">Admins only</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          This page is for Campora admins who verify new students. Your account
          does not have admin access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
          <ShieldIcon className="h-5.5 w-5.5 text-indigo-600 dark:text-indigo-400" /> Verification desk
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Review new signups and approve students of your college. Every account
          already registered with a college email address — approve people you
          recognize as students here.
        </p>
      </div>

      {decided > 0 && (
        <p role="status" className="rounded-lg bg-emerald-50 dark:bg-emerald-400/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {decided} decision{decided === 1 ? "" : "s"} saved this session.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-400/10 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <LoadingScreen label="Loading verification requests" />
      ) : pending.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-10 text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-200">No pending requests</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Every signup has been reviewed. New students will appear here when they register.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-3 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)] sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <ProfileAvatar name={s.full_name} avatarUrl={s.avatar_url} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-50">{s.full_name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{s.course} · {s.year} year</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Signed up{" "}
                    {new Date(s.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => void decide(s, "approved")}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => void decide(s, "rejected")}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
