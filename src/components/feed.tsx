"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { MAX_IMAGE_SIZE_BYTES, MAX_POST_LENGTH, type Post } from "@/lib/constants";
import { ImageIcon, ProfileAvatar, TrashIcon, XIcon } from "./icons";

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
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
      aria-label="Create a post"
    >
      <div className="flex gap-3">
        {profile && (
          <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} />
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={MAX_POST_LENGTH + 50}
          placeholder="Share something about campus today..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-pink-300 hover:text-pink-700"
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
        <span className="ml-auto text-xs text-slate-400">
          {text.length}/{MAX_POST_LENGTH}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={posting}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
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
}: {
  post: Post;
  onDeleted: (id: string) => void;
}) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const mine = user?.id === post.user_id;
  const author = post.profiles;

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
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <header className="flex items-start gap-3">
        <Link href={`/profile?id=${post.user_id}`} className="rounded-full" aria-label={`Open ${author?.full_name ?? "student"}'s profile`}>
          <ProfileAvatar name={author?.full_name ?? "?"} avatarUrl={author?.avatar_url} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile?id=${post.user_id}`}
            className="block max-w-full truncate text-left text-[15px] font-semibold text-slate-900 hover:underline"
          >
            {author?.full_name ?? "Student"}
          </Link>
          <p className="truncate text-[13px] text-slate-500">
            {author ? `${author.course} · ${author.year} year` : ""} · {formatDateTime(post.created_at)}
          </p>
        </div>
        {mine &&
          (confirming ? (
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full px-2.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Delete my post"
            >
              <TrashIcon className="h-4 w-4" /> Delete
            </button>
          ))}
      </header>

      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">{post.text}</p>

      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt="Photo attached to this post"
          className="mt-3 max-h-96 w-full rounded-xl object-cover"
          loading="lazy"
        />
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </article>
  );
}
