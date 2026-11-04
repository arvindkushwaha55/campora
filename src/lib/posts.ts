"use client";

import { useCallback, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import type { CommentItem, Post } from "./constants";

/** Columns every post query needs (author details are merged separately). */
export const POST_COLUMNS = "id, user_id, text, image_url, created_at";

export type PostRow = Omit<Post, "profiles">;

const AUTHOR_COLUMNS = "id, full_name, avatar_url, course, year, is_guest";

/**
 * Merge author profile details into plain post rows.
 *
 * Posts and profiles are loaded with two separate queries and joined here
 * on purpose: the PostgREST embed ("profiles(...)") made the whole feed
 * fail live whenever the join could not be resolved, even though both
 * tables were readable on their own. This helper is the single place that
 * merge happens (feed, profile post lists, admin moderation).
 */
export async function attachAuthors(rows: PostRow[]): Promise<Post[]> {
  if (rows.length === 0) return [];
  if (!supabase) return rows.map((r) => ({ ...r, profiles: null }));
  const authorIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: authors } = await supabase
    .from("profiles")
    .select(AUTHOR_COLUMNS)
    .in("id", authorIds);
  const byId = new Map(
    (authors ?? []).map((a) => [
      a.id,
      {
        full_name: a.full_name,
        avatar_url: a.avatar_url,
        course: a.course,
        year: a.year,
        is_guest: a.is_guest,
      },
    ])
  );
  return rows.map((r) => ({ ...r, profiles: byId.get(r.user_id) ?? null }));
}

/**
 * Like state for a list of posts: counts per post plus the set the current
 * user has liked, with optimistic toggling. Shared by the feed and profile
 * post lists so the behaviour (and its failure rollback) cannot drift.
 */
export function usePostLikes() {
  const { user } = useAuth();
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());

  /**
   * Load like rows for a batch of posts.
   * mode "merge" keeps counts for posts outside the batch (feed paging);
   * mode "replace" rebuilds state for exactly this batch (profile list).
   */
  const syncLikes = useCallback(
    async (posts: Post[], mode: "merge" | "replace" = "merge") => {
      if (!supabase || posts.length === 0) return;
      const ids = posts.map((p) => p.id);
      const { data } = await supabase
        .from("likes")
        .select("post_id, user_id")
        .in("post_id", ids);
      if (!data) return;
      setLikeCounts((prev) => {
        const next = mode === "replace" ? {} : { ...prev };
        for (const id of ids) next[id] = 0;
        for (const row of data) next[row.post_id] = (next[row.post_id] ?? 0) + 1;
        return next;
      });
      setMyLikes((prev) => {
        const next = mode === "replace" ? new Set<string>() : new Set(prev);
        for (const row of data) if (row.user_id === user?.id) next.add(row.post_id);
        return next;
      });
    },
    [user?.id]
  );

  const toggleLike = useCallback(
    async (post: Post) => {
      if (!supabase || !user) return;
      const liked = myLikes.has(post.id);
      // Optimistic update; reverted below if the database call fails.
      setMyLikes((prev) => {
        const next = new Set(prev);
        if (liked) next.delete(post.id);
        else next.add(post.id);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [post.id]: Math.max(0, (prev[post.id] ?? 0) + (liked ? -1 : 1)),
      }));
      const { error: likeError } = liked
        ? await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id)
        : await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
      if (likeError) {
        setMyLikes((prev) => {
          const next = new Set(prev);
          if (liked) next.add(post.id);
          else next.delete(post.id);
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [post.id]: Math.max(0, (prev[post.id] ?? 0) + (liked ? 1 : -1)),
        }));
      }
    },
    [myLikes, user]
  );

  return { likeCounts, myLikes, syncLikes, toggleLike };
}

/**
 * Load the comments of one post (oldest first) with author details merged
 * in, using the same two-query pattern as attachAuthors — no PostgREST
 * embed, so a join hiccup can never take the whole list down.
 */
export async function loadComments(postId: string): Promise<CommentItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, text, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  const authorIds = [...new Set(data.map((c) => c.user_id))];
  const { data: authors } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_guest")
    .in("id", authorIds);
  const byId = new Map(
    (authors ?? []).map((a) => [
      a.id,
      { full_name: a.full_name, avatar_url: a.avatar_url, is_guest: a.is_guest },
    ])
  );
  return data.map((c) => ({ ...c, profiles: byId.get(c.user_id) ?? null }));
}

/** Just the number of comments on a post (null when unavailable). */
export async function countComments(postId: string): Promise<number | null> {
  if (!supabase) return null;
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  return error ? null : (count ?? 0);
}
