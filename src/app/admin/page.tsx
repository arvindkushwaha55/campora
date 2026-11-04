"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { cardClass, type Post } from "@/lib/constants";
import { POST_COLUMNS, attachAuthors, type PostRow } from "@/lib/posts";
import { AppShell } from "@/components/shell";
import { AuthGate, LoadingScreen } from "@/components/common";
import { PostCard } from "@/components/feed";
import { ShieldIcon } from "@/components/icons";

/**
 * Admin moderation page. Accounts no longer need approval (owner's
 * decision, 2026-11-02 — approving everyone by hand did not scale);
 * instead the admin keeps the feed clean by deleting any post, here or
 * directly in the feed. The database enforces the same rule: the
 * "Admins can delete any post" RLS policy (migration_v4.sql).
 */
export default function AdminPage() {
  return (
    <AuthGate>
      <AppShell>
        <Moderation />
      </AppShell>
    </AuthGate>
  );
}

function Moderation() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    setError("");
    // Two plain queries merged in the client — the same approach as the feed.
    const { data, error: loadError } = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .order("created_at", { ascending: false });
    if (loadError) {
      setError("Could not load posts. Please try again.");
      setLoading(false);
      return;
    }
    const rows = (data as unknown as PostRow[]) ?? [];
    setPosts(await attachAuthors(rows));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (profile?.is_admin) void load();
    else setLoading(false);
  }, [profile?.is_admin, load]);

  if (!profile?.is_admin) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-12 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ShieldIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">Admins only</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          This page is for Campora admins who keep the feed clean. Your account
          does not have admin access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 font-display text-[30px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          <ShieldIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Moderation
        </h1>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Accounts no longer need approval — every student who confirms their
          college email can post straight away. Your job is just to remove
          anything that does not belong: use the delete option on any post
          below, or directly in the feed.
        </p>
      </div>

      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: posts.length, label: "Posts in feed" },
            { value: posts.filter((p) => p.image_url).length, label: "With photos" },
            { value: new Set(posts.map((p) => p.user_id)).size, label: "Students posting" },
          ].map((s) => (
            <div key={s.label} className={`${cardClass} px-3 py-3.5 text-center`}>
              <p className="font-display text-[26px] font-semibold leading-none text-slate-900 dark:text-slate-50">{s.value}</p>
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-400/10 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <LoadingScreen label="Loading posts" />
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-10 text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-200">No posts yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            When students start posting, every post will appear here for moderation.
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
          />
        ))
      )}
    </div>
  );
}
