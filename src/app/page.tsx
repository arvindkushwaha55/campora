"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/constants";
import { AppShell } from "@/components/shell";
import { AuthGate, LoadingScreen } from "@/components/common";
import { Composer, PostCard } from "@/components/feed";

const POST_SELECT =
  "id, user_id, text, image_url, created_at, profiles(full_name, avatar_url, course, year)";

function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    if (!supabase) return;
    setError("");
    const { data, error: loadError } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .order("created_at", { ascending: false });
    if (loadError) {
      setError("Could not load the feed. Please try again.");
    } else {
      setPosts((data as unknown as Post[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="flex flex-col gap-4">
      <Composer onPosted={loadPosts} />

      <section aria-label="Campus feed" className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-slate-900">Campus Feed</h2>

        {loading ? (
          <LoadingScreen label="Loading the feed" />
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-white px-4 py-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={loadPosts}
              className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Try again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
            <p className="font-semibold text-slate-700">No posts yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              The campus feed is empty. Be the first to share an update using the box above.
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
      </section>

      <footer className="pt-2 text-center text-[13px] leading-relaxed text-slate-400">
        Campora — a personal mini project, Work in Progress. Posts are shared with other
        signed-in students of this demo.
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGate>
      <AppShell>
        <Feed />
      </AppShell>
    </AuthGate>
  );
}
