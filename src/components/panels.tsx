"use client";

import { useEffect } from "react";
import { PROFILES } from "@/lib/data";
import type { CamporaStore, FeedEvent, FeedPost } from "@/lib/store";
import { Avatar, CalendarIcon, PinIcon, PulseIcon, StarIcon, XIcon } from "./icons";
import { PostCard } from "./feed";

export function EventRow({
  event,
  store,
  onOpen,
  showDescription = false,
}: {
  event: FeedEvent;
  store: CamporaStore;
  onOpen: (e: FeedEvent) => void;
  showDescription?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-[52px] w-12 shrink-0 flex-col items-center justify-center rounded-[10px] bg-indigo-50 text-indigo-800">
        <span className="text-[17px] font-extrabold leading-none">{event.day}</span>
        <span className="text-[11px] font-bold uppercase">{event.mon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => onOpen(event)} className="text-left text-[14.5px] font-semibold leading-snug text-slate-900 hover:underline">
          {event.title}
        </button>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-slate-500">
          <span>{event.time}</span>·<span>{event.spot}</span>·
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{event.category}</span>
        </p>
        {showDescription && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">{event.description}</p>
        )}
        <button
          type="button"
          onClick={() => store.toggleInterested(event.id)}
          aria-pressed={event.interestedByMe}
          className={`mt-1.5 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            event.interestedByMe
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-700"
          }`}
        >
          <StarIcon className="h-3.5 w-3.5" fill={event.interestedByMe ? "currentColor" : "none"} />
          Interested · {event.interestedCount}
        </button>
      </div>
    </li>
  );
}

export function EventsPanel({
  events,
  store,
  onOpen,
  full = false,
}: {
  events: FeedEvent[];
  store: CamporaStore;
  onOpen: (e: FeedEvent) => void;
  full?: boolean;
}) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
      aria-label="Campus events"
    >
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
        <CalendarIcon className="h-5 w-5 text-indigo-600" /> Upcoming on Campus
      </h2>
      <ul className="flex flex-col gap-4">
        {events.map((e) => (
          <EventRow key={e.id} event={e} store={store} onOpen={onOpen} showDescription={full} />
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-400">Sample events for demonstration.</p>
    </section>
  );
}

export function EventModal({
  event,
  store,
  onClose,
}: {
  event: FeedEvent;
  store: CamporaStore;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-14 w-[52px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-indigo-50 text-indigo-800">
            <span className="text-xl font-extrabold leading-none">{event.day}</span>
            <span className="text-[11px] font-bold uppercase">{event.mon}</span>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold leading-snug text-slate-900">{event.title}</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {event.category} · {event.time}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close event details">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-700">{event.description}</p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
          <PinIcon className="h-4 w-4" /> {event.spot}
        </p>
        <button
          type="button"
          onClick={() => store.toggleInterested(event.id)}
          aria-pressed={event.interestedByMe}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            event.interestedByMe
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
          }`}
        >
          <StarIcon className="h-4 w-4" fill={event.interestedByMe ? "currentColor" : "none"} />
          {event.interestedByMe ? "You're interested" : "Mark interested"} · {event.interestedCount}
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">
          Sample event. Marking interest is saved on this device only.
        </p>
      </div>
    </div>
  );
}

export function PulsePanel({
  posts,
  events,
  onOpenProfile,
  onOpenEvent,
}: {
  posts: FeedPost[];
  events: FeedEvent[];
  onOpenProfile: (authorId: string) => void;
  onOpenEvent: (e: FeedEvent) => void;
}) {
  const mostLiked = posts.length ? [...posts].sort((a, b) => b.likeCount - a.likeCount)[0] : null;
  const mostDiscussed = posts.length ? [...posts].sort((a, b) => b.comments.length - a.comments.length)[0] : null;
  const nextEvent = events[0] ?? null;
  const spotCounts = new Map<string, number>();
  posts.forEach((p) => spotCounts.set(p.spot, (spotCounts.get(p.spot) ?? 0) + 1));
  const topSpot = [...spotCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]" aria-label="Campus Pulse">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
        <PulseIcon className="h-5 w-5 text-indigo-600" /> Campus Pulse
      </h2>
      <ul className="flex flex-col gap-3 text-sm">
        {mostLiked && (
          <li>
            <span className="font-semibold text-slate-800">Most liked post: </span>
            <button type="button" className="text-indigo-700 hover:underline" onClick={() => onOpenProfile(mostLiked.authorId)}>
              {PROFILES[mostLiked.authorId].name}
            </button>
            <span className="text-slate-500"> · {mostLiked.likeCount} likes</span>
          </li>
        )}
        {mostDiscussed && mostDiscussed.comments.length > 0 && (
          <li>
            <span className="font-semibold text-slate-800">Most discussed: </span>
            <span className="text-slate-600">a post from {PROFILES[mostDiscussed.authorId].name}</span>
            <span className="text-slate-500"> · {mostDiscussed.comments.length} comments</span>
          </li>
        )}
        {nextEvent && (
          <li>
            <span className="font-semibold text-slate-800">Next event: </span>
            <button type="button" className="text-left text-indigo-700 hover:underline" onClick={() => onOpenEvent(nextEvent)}>
              {nextEvent.title}
            </button>
            <span className="text-slate-500"> · {nextEvent.day} {nextEvent.mon}</span>
          </li>
        )}
        {topSpot && (
          <li>
            <span className="font-semibold text-slate-800">Most active spot: </span>
            <span className="text-slate-600">{topSpot[0]}</span>
            <span className="text-slate-500"> · {topSpot[1]} {topSpot[1] === 1 ? "post" : "posts"}</span>
          </li>
        )}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Calculated from the posts and events on this page. Sample data — these are not live statistics.
      </p>
    </section>
  );
}

export function ProfileView({
  profileId,
  posts,
  store,
  onBack,
  onOpenProfile,
  onToast,
}: {
  profileId: string;
  posts: FeedPost[];
  store: CamporaStore;
  onBack: () => void;
  onOpenProfile: (authorId: string) => void;
  onToast: (msg: string) => void;
}) {
  const profile = PROFILES[profileId];
  const mine = profileId === "you";
  const theirPosts = posts.filter((p) => p.authorId === profileId);

  return (
    <section aria-label={`${profile.name}'s profile`} className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
        ← Back to feed
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-start gap-4">
          <Avatar name={profile.name} color={profile.color} size="lg" />
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.course}</p>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-700">{profile.bio}</p>
            <p className="mt-2 text-sm text-slate-500">
              {theirPosts.length} {theirPosts.length === 1 ? "post" : "posts"} on Campora
            </p>
            {!mine && (
              <p className="mt-2 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Sample profile
              </p>
            )}
          </div>
        </div>
      </div>
      {theirPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
          <p className="font-semibold text-slate-700">No posts yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {mine ? "Posts you write in the composer will appear here." : `${profile.name.split(" ")[0]} hasn't posted anything visible right now.`}
          </p>
        </div>
      ) : (
        theirPosts.map((post) => (
          <PostCard key={post.id} post={post} store={store} onOpenProfile={onOpenProfile} onToast={onToast} />
        ))
      )}
    </section>
  );
}
