"use client";

import { useState, type RefObject } from "react";
import { PROFILES, SPOTS, type Spot } from "@/lib/data";
import type { CamporaStore, FeedPost } from "@/lib/store";
import { Avatar, CommentIcon, CoverGlyph, FlagIcon, HeartIcon, PinIcon, SendIcon, TrashIcon } from "./icons";

const COVER_STYLES: Record<string, string> = {
  library: "bg-indigo-100 text-indigo-800",
  robot: "bg-amber-100 text-amber-800",
  code: "bg-emerald-100 text-emerald-800",
  food: "bg-pink-100 text-pink-800",
  trophy: "bg-violet-100 text-violet-800",
};

const MAX_POST_LENGTH = 500;

export function Composer({
  store,
  onToast,
  textareaRef,
}: {
  store: CamporaStore;
  onToast: (msg: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [text, setText] = useState("");
  const [spot, setSpot] = useState<Spot>("Main Block");
  const [error, setError] = useState("");

  function submit() {
    const value = text.trim();
    if (value.length < 2) {
      setError("Write a little more before posting — a post needs at least a few characters.");
      return;
    }
    if (value.length > MAX_POST_LENGTH) {
      setError(`Posts are limited to ${MAX_POST_LENGTH} characters.`);
      return;
    }
    store.addPost(value, spot);
    setText("");
    setError("");
    onToast("Post published. It is saved on this device (demo persistence — no server yet).");
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]" aria-label="Create a post">
      <div className="flex gap-3">
        <Avatar name={PROFILES.you.name} color={PROFILES.you.color} />
        <textarea
          ref={textareaRef}
          id="campora-composer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={MAX_POST_LENGTH + 50}
          placeholder="Share something about campus today..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          aria-label="Write a post"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2.5 pl-[52px]">
        <label className="flex items-center gap-1.5 text-sm text-slate-500">
          <PinIcon className="h-4 w-4" />
          <span className="sr-only">Choose a campus spot</span>
          <select
            value={spot}
            onChange={(e) => setSpot(e.target.value as Spot)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            {SPOTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-xs text-slate-400">{text.length}/{MAX_POST_LENGTH}</span>
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Post
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2.5 pl-[52px] text-sm text-red-600">{error}</p>
      )}
    </section>
  );
}

export function PostCard({
  post,
  store,
  onOpenProfile,
  onToast,
}: {
  post: FeedPost;
  store: CamporaStore;
  onOpenProfile: (authorId: string) => void;
  onToast: (msg: string) => void;
}) {
  const author = PROFILES[post.authorId];
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState<"delete" | "report" | null>(null);

  function sendComment() {
    const value = draft.trim();
    if (!value) return;
    store.addComment(post.id, value);
    setDraft("");
    setCommentsOpen(true);
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <header className="flex items-start gap-3">
        <button type="button" onClick={() => onOpenProfile(post.authorId)} className="rounded-full" aria-label={`Open ${author.name}'s profile`}>
          <Avatar name={author.name} color={author.color} />
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpenProfile(post.authorId)}
            className="block max-w-full truncate text-left text-[15px] font-semibold text-slate-900 hover:underline"
          >
            {author.name}
          </button>
          <p className="truncate text-[13px] text-slate-500">
            {author.course} · {post.timeLabel}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          <PinIcon className="h-3.5 w-3.5" /> {post.spot}
        </span>
      </header>

      {post.sample && (
        <p className="mt-2 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Sample post
        </p>
      )}

      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">{post.text}</p>

      {post.cover && (
        <div className={`mt-3 flex h-28 items-center justify-center gap-3 rounded-xl ${COVER_STYLES[post.cover.icon]}`}>
          <CoverGlyph icon={post.cover.icon} />
          <span className="text-sm font-semibold">{post.cover.label}</span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => store.toggleLike(post.id)}
          aria-pressed={post.likedByMe}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            post.likedByMe ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <HeartIcon className="h-[18px] w-[18px]" fill={post.likedByMe ? "currentColor" : "none"} />
          {post.likeCount}
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen((v) => !v)}
          aria-expanded={commentsOpen}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <CommentIcon className="h-[18px] w-[18px]" />
          {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
        </button>
        <span className="ml-auto flex items-center gap-1">
          {post.mine ? (
            confirming === "delete" ? (
              <>
                <button type="button" className="rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => { store.deletePost(post.id); onToast("Your post was deleted from this device."); }}>
                  Confirm delete
                </button>
                <button type="button" className="rounded-full px-2.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => setConfirming(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirming("delete")} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete my post">
                <TrashIcon className="h-4 w-4" /> Delete
              </button>
            )
          ) : post.reportedByMe ? (
            <span className="px-2.5 py-1.5 text-[13px] text-slate-400">Reported</span>
          ) : confirming === "report" ? (
            <>
              <button type="button" className="rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-amber-700 hover:bg-amber-50"
                onClick={() => { store.reportPost(post.id); onToast("Report saved on this device and the post is hidden for you. Campora has no moderation backend yet, so reports are not reviewed automatically."); }}>
                Confirm report
              </button>
              <button type="button" className="rounded-full px-2.5 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50" onClick={() => setConfirming(null)}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming("report")} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] text-slate-400 hover:bg-slate-50 hover:text-slate-600" aria-label="Report this post">
              <FlagIcon className="h-4 w-4" /> Report
            </button>
          )}
        </span>
      </div>

      {commentsOpen && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {post.comments.length === 0 ? (
            <p className="text-sm text-slate-400">No comments yet. Start the conversation.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {post.comments.map((c) => {
                const ca = PROFILES[c.authorId];
                return (
                  <li key={c.id} className="flex gap-2.5">
                    <Avatar name={ca.name} color={ca.color} size="sm" />
                    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[13px] font-semibold text-slate-800">
                        {ca.name} <span className="ml-1 font-normal text-slate-400">{c.timeLabel}</span>
                      </p>
                      <p className="text-sm leading-relaxed text-slate-700">{c.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => { e.preventDefault(); sendComment(); }}
          >
            <label className="sr-only" htmlFor={`comment-${post.id}`}>Add a comment</label>
            <input
              id={`comment-${post.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment..."
              className="w-full rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700" aria-label="Send comment">
              <SendIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export function FeedSection({
  posts,
  store,
  spot,
  onSpotChange,
  onOpenProfile,
  onToast,
}: {
  posts: FeedPost[];
  store: CamporaStore;
  spot: Spot | "All";
  onSpotChange: (s: Spot | "All") => void;
  onOpenProfile: (authorId: string) => void;
  onToast: (msg: string) => void;
}) {
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const filtered = spot === "All" ? posts : posts.filter((p) => p.spot === spot);
  const sorted = [...filtered].sort((a, b) =>
    sort === "latest" ? a.hoursAgo - b.hoursAgo : b.likeCount - a.likeCount
  );

  return (
    <section aria-label="Campus feed" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-1 text-lg font-bold text-slate-900">Campus Feed</h2>
        <div className="ml-auto flex rounded-full border border-slate-200 bg-white p-0.5" role="group" aria-label="Sort feed">
          {(["latest", "popular"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold capitalize transition-colors ${
                sort === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by campus spot">
        {(["All", ...SPOTS] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpotChange(s)}
            aria-pressed={spot === s}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              spot === s
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
          <p className="font-semibold text-slate-700">No posts here yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {spot === "All"
              ? "The feed is empty right now. Be the first to share a campus update."
              : `Nothing has been posted from ${spot} yet. Try a different spot, or post the first update from there.`}
          </p>
          {spot !== "All" && (
            <button type="button" onClick={() => onSpotChange("All")} className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
              Show all posts
            </button>
          )}
        </div>
      ) : (
        sorted.map((post) => (
          <PostCard key={post.id} post={post} store={store} onOpenProfile={onOpenProfile} onToast={onToast} />
        ))
      )}
    </section>
  );
}
