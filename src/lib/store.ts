"use client";

// Campora data layer (frontend phase).
//
// All reads/writes go through this module so the UI never touches storage
// directly. Sample content lives in lib/data.ts. Things the current user
// does — posting, liking, commenting, marking events interested,
// reporting — are persisted in the browser's localStorage only.
//
// This is deliberately NOT a multi-user backend: data does not leave the
// device and there are no accounts. The Supabase phase will replace these
// functions with real database calls behind the same interface.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CURRENT_USER_ID,
  SAMPLE_EVENTS,
  SAMPLE_POSTS,
  type CommentItem,
  type EventItem,
  type Post,
  type Spot,
} from "./data";

const POSTS_KEY = "campora:userPosts:v1";
const INTERACTIONS_KEY = "campora:interactions:v1";

export interface Interactions {
  liked: string[];
  comments: Record<string, CommentItem[]>;
  interested: string[];
  reported: string[];
  hidden: string[];
}

const EMPTY_INTERACTIONS: Interactions = {
  liked: [],
  comments: {},
  interested: [],
  reported: [],
  hidden: [],
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — the app keeps working in-memory.
  }
}

export interface FeedPost extends Post {
  likeCount: number;
  likedByMe: boolean;
  comments: CommentItem[];
  reportedByMe: boolean;
  mine: boolean;
}

export interface FeedEvent extends EventItem {
  interestedCount: number;
  interestedByMe: boolean;
}

export function useCamporaStore() {
  const [hydrated, setHydrated] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [interactions, setInteractions] = useState<Interactions>(EMPTY_INTERACTIONS);

  useEffect(() => {
    setUserPosts(readJSON<Post[]>(POSTS_KEY, []));
    setInteractions(readJSON<Interactions>(INTERACTIONS_KEY, EMPTY_INTERACTIONS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeJSON(POSTS_KEY, userPosts);
  }, [userPosts, hydrated]);

  useEffect(() => {
    if (hydrated) writeJSON(INTERACTIONS_KEY, interactions);
  }, [interactions, hydrated]);

  const posts: FeedPost[] = useMemo(() => {
    const merged = [...userPosts, ...SAMPLE_POSTS].filter(
      (p) => !interactions.hidden.includes(p.id)
    );
    return merged.map((p) => ({
      ...p,
      likeCount: p.baseLikes + (interactions.liked.includes(p.id) ? 1 : 0),
      likedByMe: interactions.liked.includes(p.id),
      comments: [...p.sampleComments, ...(interactions.comments[p.id] ?? [])],
      reportedByMe: interactions.reported.includes(p.id),
      mine: p.authorId === CURRENT_USER_ID,
    }));
  }, [userPosts, interactions]);

  const events: FeedEvent[] = useMemo(
    () =>
      SAMPLE_EVENTS.map((e) => ({
        ...e,
        interestedCount: e.baseInterested + (interactions.interested.includes(e.id) ? 1 : 0),
        interestedByMe: interactions.interested.includes(e.id),
      })),
    [interactions]
  );

  const toggleIn = useCallback((list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id], []);

  const addPost = useCallback((text: string, spot: Spot) => {
    const post: Post = {
      id: `u${Date.now()}`,
      authorId: CURRENT_USER_ID,
      text,
      spot,
      timeLabel: "Just now",
      hoursAgo: 0,
      baseLikes: 0,
      sampleComments: [],
    };
    setUserPosts((prev) => [post, ...prev]);
    return post;
  }, []);

  const deletePost = useCallback((postId: string) => {
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    setInteractions((prev) => {
      const comments = { ...prev.comments };
      delete comments[postId];
      return {
        ...prev,
        comments,
        liked: prev.liked.filter((x) => x !== postId),
      };
    });
  }, []);

  const toggleLike = useCallback(
    (postId: string) =>
      setInteractions((prev) => ({ ...prev, liked: toggleIn(prev.liked, postId) })),
    [toggleIn]
  );

  const addComment = useCallback((postId: string, text: string) => {
    const comment: CommentItem = {
      id: `c${Date.now()}`,
      authorId: CURRENT_USER_ID,
      text,
      timeLabel: "Just now",
    };
    setInteractions((prev) => ({
      ...prev,
      comments: {
        ...prev.comments,
        [postId]: [...(prev.comments[postId] ?? []), comment],
      },
    }));
  }, []);

  const toggleInterested = useCallback(
    (eventId: string) =>
      setInteractions((prev) => ({ ...prev, interested: toggleIn(prev.interested, eventId) })),
    [toggleIn]
  );

  const reportPost = useCallback((postId: string) => {
    setInteractions((prev) => ({
      ...prev,
      reported: prev.reported.includes(postId) ? prev.reported : [...prev.reported, postId],
      hidden: prev.hidden.includes(postId) ? prev.hidden : [...prev.hidden, postId],
    }));
  }, []);

  return {
    hydrated,
    posts,
    events,
    addPost,
    deletePost,
    toggleLike,
    addComment,
    toggleInterested,
    reportPost,
  };
}

export type CamporaStore = ReturnType<typeof useCamporaStore>;
