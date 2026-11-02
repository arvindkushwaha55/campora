"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { MAX_IMAGE_SIZE_BYTES, MAX_POST_LENGTH, type Post } from "@/lib/constants";
import { DotsIcon, HeartIcon, ImageIcon, ProfileAvatar, TrashIcon, XIcon } from "./icons";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function storagePathFromPublicUrl(publicUrl: string, bucket: string) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx === -1 ? null : publicUrl.slice(idx + marker.length);
}

export function Composer({ onPosted }: { onPosted: () => void }) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickImage(file: File | null) {
    setError("");
    if (!file) {
      setImage(null);
      setPreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Image is too large — please keep it under 5 MB.");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function submit() {
    if (!supabase || !user) return;
    const value = text.trim();
    if (value.length < 1) {
      setError("Write something before posting.");
      return;
    }
    if (value.length > MAX_POST_LENGTH) {
      setError(`Posts are limited to ${MAX_POST_LENGTH} characters.`);
      return;
    }
    setPosting(true);
    setError("");
    try {
      let imageUrl: string | null = null;
      if (image) {
        const ext = image.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, image);
        if (uploadError) throw new Error("Image upload failed. Please try again.");
        imageUrl = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
      }
      const { error: insertError } = await supabase
        .from("posts")
        .insert({ user_id: user.id, text: value, image_url: imageUrl });
      if (insertError) throw new Error("Could not publish the post. Please try again.");
      setText("");
      pickImage(null);
      if (fileRef.current) fileRef.current.value = "";
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section
      className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)]"
      aria-label="Create a post"
    >
      <div className="flex gap-3">
        {profile && (
          <span className="h-fit shrink-0 rounded-full ring-2 ring-pink-100 dark:ring-pink-500/25">
            <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} />
          </span>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={MAX_POST_LENGTH + 50}
          placeholder="Share something about campus today..."
          className="w-full resize-y rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-[15px] text-slate-900 dark:text-slate-50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
          aria-label="Write a post"
        />
      </div>

      {preview && (
        <div className="relative mt-3 pl-[52px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected for this post" className="max-h-56 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => pickImage(null)}
            className="absolute left-[60px] top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900/70 text-white"
            aria-label="Remove image"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2.5 pl-[52px]">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-pink-300 hover:text-pink-700"
        >
          <ImageIcon className="h-4.5 w-4.5" /> Add photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
        />
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {text.length}/{MAX_POST_LENGTH}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={posting}
          className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/20 px-6 py-2 text-sm font-semibold text-white transition-all hover:from-indigo-700 hover:to-violet-700 active:scale-95 disabled:opacity-60"
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2.5 pl-[52px] text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

export function PostCard({
  post,
  onDeleted,
  likeCount = 0,
  likedByMe = false,
  onToggleLike,
}: {
  post: Post;
  onDeleted: (id: string) => void;
  likeCount?: number;
  likedByMe?: boolean;
  onToggleLike?: (post: Post) => void;
}) {
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pop, setPop] = useState(false);
  const [error, setError] = useState("");
  const mine = user?.id === post.user_id;
  // Admins moderate the feed: they can delete anyone's post (RLS allows it).
  const canDelete = mine || profile?.is_admin === true;
  const author = post.profiles;

  function handleLikeClick() {
    if (!onToggleLike) return;
    if (!likedByMe) {
      setPop(true);
      window.setTimeout(() => setPop(false), 320);
    }
    onToggleLike(post);
  }

  async function handleDelete() {
    if (!supabase) return;
    setDeleting(true);
    setError("");
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", post.id);
    if (deleteError) {
      setError("Could not delete this post. Please try again.");
      setDeleting(false);
      return;
    }
    if (post.image_url) {
      const path = storagePathFromPublicUrl(post.image_url, "post-images");
      if (path) await supabase.storage.from("post-images").remove([path]);
    }
    onDeleted(post.id);
  }

  return (
    <article className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)]">
      <header className="flex items-start gap-3">
        <Link
          href={`/profile?id=${post.user_id}`}
          className="shrink-0 rounded-full ring-2 ring-pink-100 dark:ring-pink-500/25"
          aria-label={`Open ${author?.full_name ?? "student"}'s profile`}
        >
          <ProfileAvatar name={author?.full_name ?? "?"} avatarUrl={author?.avatar_url} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile?id=${post.user_id}`}
            className="block max-w-full truncate text-left text-[15px] font-semibold text-slate-900 dark:text-slate-50 hover:underline"
          >
            {author?.full_name ?? "Student"}
          </Link>
          <p className="truncate text-[13px] text-slate-500 dark:text-slate-400">
            {author ? (author.is_guest ? "Guest" : `${author.course} · ${author.year} year`) : ""} · {formatDateTime(post.created_at)}
          </p>
        </div>
        {canDelete && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((o) => !o);
                setConfirming(false);
              }}
              className="grid h-8 w-8 place-items-center rounded-full text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Post options"
              aria-expanded={menuOpen}
            >
              <DotsIcon className="h-5 w-5" />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl shadow-slate-900/10">
                  {confirming ? (
                    <div className="px-2 py-1.5">
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">Delete this post?</p>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                        >
                          {deleting ? "Deleting..." : "Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(false)}
                          className="flex-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Keep it
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-400/10"
                    >
                      <TrashIcon className="h-4 w-4" /> Delete post
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">{post.text}</p>

      {post.image_url && (
        <div className="mt-3.5 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt="Photo attached to this post"
            className="max-h-96 w-full object-cover transition-transform duration-500 hover:scale-[1.015]"
            loading="lazy"
          />
        </div>
      )}

      {onToggleLike && (
        <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={handleLikeClick}
            aria-pressed={likedByMe}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all active:scale-95 ${
              likedByMe
                ? "bg-rose-50 dark:bg-rose-400/10 text-rose-600"
                : "text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            }`}
          >
            <span className={pop ? "inline-flex animate-[pop_0.3s_ease]" : "inline-flex"}>
              <HeartIcon className="h-4.5 w-4.5" fill={likedByMe ? "currentColor" : "none"} />
            </span>
            {likeCount} {likeCount === 1 ? "Like" : "Likes"}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </article>
  );
}
