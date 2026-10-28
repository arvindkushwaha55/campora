"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { fileExtension, getSupabase } from "@/lib/supabase";
import { MAX_IMAGE_BYTES, MAX_POST_LENGTH, type Post } from "@/lib/constants";
import { Framed } from "./common";
import { ImageIcon, ProfileAvatar, TrashIcon } from "./icons";

/** "28 Oct 2026, 9:41 am" — date + time for every post, as required. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${date}, ${time}`;
}

const POST_SELECT =
  "id, user_id, text, image_url, created_at, profiles(full_name, avatar_url, course, year)";

async function fetchFeed(): Promise<Post[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Post[] | null) ?? [];
}

export function Feed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setPosts(await fetchFeed());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Framed>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {profile ? `Hi, ${profile.full_name.split(" ")[0]} 👋` : "Campus Feed"}
          </h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Posts from students on your campus, newest first.
          </p>
        </div>

        <Composer onPosted={load} />

        <section aria-label="Campus feed" className="flex flex-col gap-4">
          <h2 className="text-base font-black tracking-tight">Campus Feed</h2>
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
              {error}{" "}
              <button type="button" onClick={() => void load()} className="font-bold underline">
                Retry
              </button>
            </p>
          )}
          {loading ? (
            <p className="py-10 text-center text-sm text-stone-500">Loading the feed…</p>
          ) : posts.length === 0 && !error ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
              <p className="text-base font-bold">No posts yet</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-stone-500">
                Be the first to share something about campus today.
              </p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} onDeleted={load} />)
          )}
        </section>
      </div>
    </Framed>
  );
}

function Composer({ onPosted }: { onPosted: () => Promise<void> }) {
  const { session, profile } = useAuth();
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imagePreview = image ? URL.createObjectURL(image) : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = getSupabase();
    if (!supabase || !session) return;

    const trimmed = text.trim();
    if (!trimmed) return setError("Write something first — a post needs text.");
    if (trimmed.length > MAX_POST_LENGTH)
      return setError(`Please keep the post under ${MAX_POST_LENGTH} characters.`);
    if (image) {
      if (!image.type.startsWith("image/")) return setError("The attached file must be an image.");
      if (image.size > MAX_IMAGE_BYTES) return setError("Image must be smaller than 5 MB.");
    }

    setBusy(true);
    try {
      // 1. Optional image → post-images bucket, inside my own folder only.
      let imageUrl: string | null = null;
      if (image) {
        const path = `${session.user.id}/${Date.now()}.${fileExtension(image.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, image, { contentType: image.type });
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        imageUrl = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
      }
      // 2. The post row itself (RLS checks that user_id is really me).
      const { error: insertError } = await supabase
        .from("posts")
        .insert({ user_id: session.user.id, text: trimmed, image_url: imageUrl });
      if (insertError) throw new Error(insertError.message);

      setText("");
      setImage(null);
      await onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish the post. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-stone-900/5 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <ProfileAvatar
          name={profile?.full_name ?? "You"}
          avatarUrl={profile?.avatar_url}
          className="mt-0.5 h-10 w-10 text-xs"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={MAX_POST_LENGTH + 100}
          placeholder="Share something about campus today..."
          className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
          aria-label="Write a post"
        />
      </div>

      {imagePreview && (
        <div className="relative mt-3 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Selected attachment" className="max-h-64 w-full object-cover" />
          <button
            type="button"
            onClick={() => setImage(null)}
            className="absolute right-2.5 top-2.5 rounded-full bg-stone-900/70 px-3 py-1 text-xs font-bold text-white"
          >
            Remove
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-xl bg-stone-900/5 px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-900/10"
        >
          <ImageIcon className="h-4.5 w-4.5" />
          {image ? "Change photo" : "Add photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
        <span className="ml-auto text-xs font-medium text-stone-400">
          {text.trim().length}/{MAX_POST_LENGTH}
        </span>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}

/** Extracts the storage path from a post-images public URL (for cleanup). */
function storagePathFromUrl(publicUrl: string): string | null {
  const marker = "/post-images/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length).split("?")[0]);
}

export function PostCard({
  post,
  onDeleted,
}: {
  post: Post;
  onDeleted?: () => void | Promise<void>;
}) {
  const { session } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mine = session?.user.id === post.user_id;
  const authorName = post.profiles?.full_name ?? "Student";

  async function onDelete() {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError("");
    // Best-effort cleanup of the attached image; the row delete is the
    // source of truth and RLS guarantees only my own post can be deleted.
    if (post.image_url) {
      const path = storagePathFromUrl(post.image_url);
      if (path) await supabase.storage.from("post-images").remove([path]);
    }
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", post.id);
    setBusy(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await onDeleted?.();
  }

  return (
    <article className="rounded-3xl border border-stone-900/5 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <header className="flex items-start gap-3">
        <Link href={`/profile?id=${post.user_id}`} className="shrink-0">
          <ProfileAvatar name={authorName} avatarUrl={post.profiles?.avatar_url} />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link
            href={`/profile?id=${post.user_id}`}
            className="truncate text-[15px] font-bold hover:underline"
          >
            {authorName}
          </Link>
          <p className="mt-0.5 text-xs text-stone-500">
            {post.profiles?.course && post.profiles?.year
              ? `${post.profiles.course} · ${post.profiles.year} year · `
              : ""}
            {formatDateTime(post.created_at)}
          </p>
        </div>
        {mine &&
          (confirming ? (
            <span className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDelete()}
                className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Confirm delete"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(false)}
                className="rounded-lg bg-stone-900/5 px-2.5 py-1.5 text-xs font-bold text-stone-700"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-500 transition hover:bg-rose-50 hover:text-rose-700"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          ))}
      </header>

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{post.text}</p>

      {post.image_url && (
        <div className="mt-3 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_url} alt="Post attachment" className="max-h-96 w-full object-cover" />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </article>
  );
}
