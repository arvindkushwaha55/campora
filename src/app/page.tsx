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

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Feed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const { likeCounts, myLikes, syncLikes, toggleLike } = usePostLikes();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          {firstName ? `${greetingForNow()}, ${firstName}` : "Campus Feed"}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          What&rsquo;s happening around your college — shared by students and guests of your campus.
        </p>
      </div>

      <Composer onPosted={reload} />

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
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                likeCount={likeCounts[post.id] ?? 0}
                likedByMe={myLikes.has(post.id)}
                onToggleLike={toggleLike}
                onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              />
            ))}
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
