"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { FEED_PAGE_SIZE, type Post } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { POST_COLUMNS, attachAuthors, usePostLikes, type PostRow } from "@/lib/posts";
import { AppShell } from "@/components/shell";
import { LoadingScreen, NotConfigured, VerificationScreen } from "@/components/common";
import { Landing } from "@/components/landing";
import { Composer, PostCard } from "@/components/feed";
import { CheckIcon } from "@/components/icons";

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Editorial day label for feed dividers: "Today", "Yesterday", or the date. */
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

function Feed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const { likeCounts, myLikes, syncLikes, toggleLike } = usePostLikes();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "photos" | "text">("all");
  const [toast, setToast] = useState("");
  const pageRef = useRef(0);

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      if (!supabase) return;
      const from = page * FEED_PAGE_SIZE;
      const { data, error: loadError } = await supabase
        .from("posts")
        .select(POST_COLUMNS)
        .order("created_at", { ascending: false })
        .range(from, from + FEED_PAGE_SIZE - 1);
      if (loadError) {
        if (!append) setError("Could not load the feed. Please try again.");
        return;
      }
      const rows = (data as unknown as PostRow[]) ?? [];
      const posts = await attachAuthors(rows);
      setHasMore(rows.length === FEED_PAGE_SIZE);
      setPosts((prev) => (append ? [...prev, ...posts] : posts));
      pageRef.current = page;
      await syncLikes(posts, "merge");
    },
    [syncLikes]
  );

  const reload = useCallback(async () => {
    setError("");
    setLoading(true);
    await loadPage(0, false);
    setLoading(false);
  }, [loadPage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const firstName = profile?.full_name?.trim().split(" ")[0];
  const visiblePosts = posts.filter((post) =>
    filter === "all" ? true : filter === "photos" ? Boolean(post.image_url) : !post.image_url
  );
  // Group the visible posts under editorial day dividers ("Today", ...).
  const feedItems: { label: string | null; post: Post }[] = [];
  {
    let last = "";
    for (const post of visiblePosts) {
      const label = dayLabel(post.created_at);
      feedItems.push({ label: label !== last ? label : null, post });
      last = label;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
          The campus feed · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1.5 font-display text-[32px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
          {firstName ? (
            <>
              {greetingForNow()},{" "}
              <span className="italic text-indigo-600 dark:text-indigo-400">{firstName}</span>
            </>
          ) : (
            "Campus Feed"
          )}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          What&rsquo;s happening around your college — shared by students and guests of your campus.
        </p>
      </div>

      <Composer
        onPosted={() => {
          void reload();
          setToast("Your post is live in the feed.");
          window.setTimeout(() => setToast(""), 3400);
        }}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 animate-[rise_0.3s_ease_both] items-center gap-2 rounded-full bg-slate-900 py-2.5 pl-3.5 pr-5 text-sm font-semibold text-white shadow-2xl dark:bg-white dark:text-slate-900 lg:bottom-8"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white dark:text-white">
            <CheckIcon className="h-3 w-3" />
          </span>
          {toast}
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1" role="group" aria-label="Filter posts">
            {(
              [
                { id: "all", label: "All posts" },
                { id: "photos", label: "Photos" },
                { id: "text", label: "Text only" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all active:scale-95 ${
                  filter === f.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-medium text-slate-400 dark:text-slate-500">
            Showing {visiblePosts.length} of {posts.length} loaded posts
          </span>
        </div>
      )}

      <section aria-label="Campus feed" className="flex flex-col gap-4">

        {loading ? (
          <LoadingScreen label="Loading the feed" />
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-red-200 bg-white dark:bg-slate-900 px-4 py-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-3 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
            >
              Try again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-10 text-center">
            <p className="font-semibold text-slate-700 dark:text-slate-200">No posts yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              The campus feed is empty. Be the first to share an update using the box above.
            </p>
          </div>
        ) : (
          <>
            {visiblePosts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-10 text-center">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  No {filter === "photos" ? "photo" : "text-only"} posts in the loaded feed
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {hasMore
                    ? "Load more posts below, or switch back to All posts."
                    : "Switch back to All posts to see everything."}
                </p>
              </div>
            ) : (
              feedItems.map(({ label, post }) => (
                <div key={post.id} className="flex flex-col gap-4">
                  {label && (
                    <div className="flex items-center gap-3 pt-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span className="font-display text-[15px] font-semibold italic tracking-tight text-slate-700 dark:text-slate-200">
                        {label}
                      </span>
                      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                  )}
                  <PostCard
                    post={post}
                    likeCount={likeCounts[post.id] ?? 0}
                    likedByMe={myLikes.has(post.id)}
                    onToggleLike={toggleLike}
                    onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                  />
                </div>
              ))
            )}
            {hasMore && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={async () => {
                  setLoadingMore(true);
                  await loadPage(pageRef.current + 1, true);
                  setLoadingMore(false);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
              >
                {loadingMore ? "Loading..." : "Load more posts"}
              </button>
            )}
          </>
        )}
      </section>

      <footer className="pt-2 text-center text-[13px] leading-relaxed text-slate-400 dark:text-slate-500">
        Campora — a personal mini project, Work in Progress. Posts are shared with other
        verified students of your college.
      </footer>
    </div>
  );
}

export default function HomePage() {
  const { user, profile, loading } = useAuth();

  if (!isSupabaseConfigured) return <NotConfigured />;
  if (loading || (user && !profile)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <LoadingScreen />
      </div>
    );
  }
  if (!user) return <Landing />;
  if (profile && !profile.is_admin && profile.verification_status !== "approved") {
    return <VerificationScreen profile={profile} />;
  }
  return (
    <AppShell rail>
      <Feed />
    </AppShell>
  );
}
