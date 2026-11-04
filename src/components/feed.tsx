"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { MAX_COMMENT_LENGTH, MAX_IMAGE_SIZE_BYTES, MAX_POST_LENGTH, cardClass, type CommentItem, type Post } from "@/lib/constants";
import { countComments, loadComments } from "@/lib/posts";
import { CommentIcon, DotsIcon, HeartIcon, ImageIcon, ProfileAvatar, SendIcon, TrashIcon, XIcon } from "./icons";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Social-style relative time for fresh posts ("5m ago"); older items fall back to the full date. */
export function formatRelativeTime(iso: string) {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return "Just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(iso);
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

  // Release the object URL of the previous preview whenever it is replaced
  // or the composer unmounts, so picked photos do not linger in memory.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

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
      className={`${cardClass} p-5 transition-shadow focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-500/20`}
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
          disabled={posting || text.trim().length === 0}
          className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
        >
          {!posting && <SendIcon className="h-4 w-4" />}
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
  const [lightbox, setLightbox] = useState(false);
  // Comments: count loads with the card; the list itself loads on first open.
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [draft, setDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const mine = user?.id === post.user_id;
  // Admins moderate the feed: they can delete anyone's post (RLS allows it).
  const canDelete = mine || profile?.is_admin === true;
  const author = post.profiles;

  // Escape closes the options menu, like a native menu.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setConfirming(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Comment count for the action row (null = comments unavailable, hide UI).
  useEffect(() => {
    let alive = true;
    void countComments(post.id).then((n) => {
      if (alive) setCommentCount(n);
    });
    return () => {
      alive = false;
    };
  }, [post.id]);

  // Escape closes the photo lightbox.
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  async function toggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments === null) {
      setComments(await loadComments(post.id));
    }
  }

  async function submitComment() {
    if (!supabase || !user) return;
    const value = draft.trim();
    if (value.length < 1) {
      setCommentError("Write something first.");
      return;
    }
    if (value.length > MAX_COMMENT_LENGTH) {
      setCommentError(`Comments are limited to ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }
    setPostingComment(true);
    setCommentError("");
    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({ post_id: post.id, user_id: user.id, text: value })
      .select("id, post_id, user_id, text, created_at")
      .single();
    setPostingComment(false);
    if (insertError || !data) {
      setCommentError("Could not post the comment. Please try again.");
      return;
    }
    setComments((prev) => [
      ...(prev ?? []),
      {
        ...data,
        profiles: profile
          ? { full_name: profile.full_name, avatar_url: profile.avatar_url, is_guest: profile.is_guest }
          : null,
      },
    ]);
    setCommentCount((n) => (n ?? 0) + 1);
    setDraft("");
  }

  async function deleteComment(comment: CommentItem) {
    if (!supabase) return;
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", comment.id);
    if (deleteError) {
      setCommentError("Could not delete that comment.");
      return;
    }
    setComments((prev) => (prev ?? []).filter((c) => c.id !== comment.id));
    setCommentCount((n) => Math.max(0, (n ?? 1) - 1));
  }

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
    <article className={`${cardClass} p-5`}>
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
            {author ? (author.is_guest ? "Guest" : `${author.course} · ${author.year} year`) : ""} ·{" "}
            <span title={formatDateTime(post.created_at)}>{formatRelativeTime(post.created_at)}</span>
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
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="mt-3.5 block w-full cursor-zoom-in overflow-hidden rounded-2xl ring-1 ring-slate-900/5 dark:ring-white/10"
          aria-label="View this photo full screen"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt="Photo attached to this post"
            className="img-reveal max-h-96 w-full object-cover transition-transform duration-500 hover:scale-[1.015]"
            loading="lazy"
          />
        </button>
      )}

      {(onToggleLike || commentCount !== null) && (
        <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          {onToggleLike && (
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
          )}
          {commentCount !== null && (
            <button
              type="button"
              onClick={toggleComments}
              aria-expanded={commentsOpen}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all active:scale-95 ${
                commentsOpen
                  ? "bg-indigo-50 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-300"
                  : "text-slate-500 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-400/10 dark:hover:text-indigo-300"
              }`}
            >
              <CommentIcon className="h-4.5 w-4.5" />
              {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
            </button>
          )}
        </div>
      )}

      {commentsOpen && (
        <div className="mt-3 animate-[rise_0.25s_ease_both] border-t border-slate-100 dark:border-slate-800 pt-3">
          {comments === null ? (
            <p className="py-1 text-sm text-slate-400 dark:text-slate-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="py-1 text-sm text-slate-400 dark:text-slate-500">
              No comments yet — start the conversation.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {comments.map((comment) => {
                const cAuthor = comment.profiles;
                const canDeleteComment = user?.id === comment.user_id || profile?.is_admin === true;
                return (
                  <li key={comment.id} className="flex gap-2.5">
                    <span className="shrink-0">
                      <ProfileAvatar name={cAuthor?.full_name ?? "?"} avatarUrl={cAuthor?.avatar_url} size="sm" />
                    </span>
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                      <p className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                        <span className="font-semibold text-slate-900 dark:text-slate-50">
                          {cAuthor?.full_name ?? "Student"}
                        </span>
                        {cAuthor?.is_guest && (
                          <span className="rounded-full bg-amber-100 dark:bg-amber-400/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                            Guest
                          </span>
                        )}
                        <span className="text-xs font-normal text-slate-400 dark:text-slate-500" title={formatDateTime(comment.created_at)}>
                          {formatRelativeTime(comment.created_at)}
                        </span>
                        {canDeleteComment && (
                          <button
                            type="button"
                            onClick={() => void deleteComment(comment)}
                            className="ml-auto text-xs font-medium text-slate-400 transition-colors hover:text-red-600 dark:text-slate-500"
                            aria-label="Delete this comment"
                          >
                            Delete
                          </button>
                        )}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {comment.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {user && (
            <div className="mt-3 flex items-start gap-2.5">
              {profile && (
                <span className="shrink-0">
                  <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} size="sm" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submitComment();
                      }
                    }}
                    maxLength={MAX_COMMENT_LENGTH + 50}
                    placeholder="Write a comment..."
                    aria-label="Write a comment"
                    className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => void submitComment()}
                    disabled={postingComment || draft.trim().length === 0}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                    aria-label="Post comment"
                  >
                    <SendIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <span>Press Enter to send</span>
                  <span>
                    {draft.length}/{MAX_COMMENT_LENGTH}
                  </span>
                </p>
                {commentError && (
                  <p role="alert" className="mt-1.5 text-[13px] text-red-600">
                    {commentError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {lightbox && post.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close photo viewer"
          >
            <XIcon className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt="Photo attached to this post"
            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
}
