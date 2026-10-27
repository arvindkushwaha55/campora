"use client";

import { useEffect, useRef, useState } from "react";
import { PROFILES, SPOTS, type CampusEvent } from "@/lib/data";
import type { CamporaStore, FeedPost } from "@/lib/store";
import { PostCard } from "./feed";
import { Avatar, CalendarIcon, CheckIcon, PinIcon, PulseIcon, SearchIcon, StarIcon, XIcon } from "./icons";

export function EventCard({
  event,
  store,
  onOpen,
}: {
  event: CampusEvent;
  store: CamporaStore;
  onOpen: (e: CampusEvent) => void;
}) {
  const interested = store.interestedIds.includes(event.id);
  const count = event.baseInterested + (interested ? 1 : 0);
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">{event.date}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{event.category}</span>
        <span className="ml-auto text-xs font-medium text-slate-400">Sample event</span>
      </div>
      <h3 className="mt-3 text-base font-bold text-slate-900">{event.title}</h3>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
        <CalendarIcon className="h-4 w-4" /> {event.time}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
        <PinIcon className="h-4 w-4" /> {event.venue}
      </p>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{event.about}</p>
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-[13px] text-slate-500">{count} interested</span>
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => onOpen(event)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => store.toggleInterested(event.id)}
            aria-pressed={interested}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              interested ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {interested && <CheckIcon className="h-3.5 w-3.5" />}
            {interested ? "Interested" : "Interested?"}
          </button>
        </span>
      </div>
    </article>
  );
}

export function EventsSection({
  events,
  store,
  onOpen,
}: {
  events: CampusEvent[];
  store: CamporaStore;
  onOpen: (e: CampusEvent) => void;
}) {
  return (
    <section aria-label="Campus events" className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Upcoming on Campus</h2>
        <p className="mt-0.5 text-sm text-slate-500">Sample events for the demo. Marking yourself interested is saved on this device.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((e) => (
          <EventCard key={e.id} event={e} store={store} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

export function PulseWidget({ posts, store }: { posts: FeedPost[]; store: CamporaStore }) {
  const now = Date.now();
  const activeNow = posts.filter((p) => now - p.createdAt < 60 * 60 * 1000).length;
  const counts = SPOTS.map((spot) => ({ spot, n: posts.filter((p) => p.spot === spot).length }))
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...counts.map((c) => c.n));
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]" aria-label="Campus Pulse">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
        <PulseIcon className="h-4.5 w-4.5 text-indigo-600" /> Campus Pulse
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        <strong className="font-semibold text-slate-900">{activeNow}</strong>{" "}
        {activeNow === 1 ? "post was" : "posts were"} shared in the last hour.
      </p>
      <p className="mt-0.5 text-xs text-slate-400">Calculated live from the posts currently on this page — demo data, not real campus traffic.</p>
      <h4 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-slate-400">Most active spots</h4>
      <ul className="mt-2 flex flex-col gap-2">
        {counts.slice(0, 3).map((c) => (
          <li key={c.spot} className="flex items-center gap-2 text-sm">
            <span className="w-28 shrink-0 truncate text-slate-600">{c.spot}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${Math.round((c.n / max) * 100)}%` }} />
            </span>
            <span className="w-6 text-right font-semibold text-slate-700">{c.n}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-slate-100 pt-3 text-[13px] text-slate-500">
        {store.interestedIds.length} {store.interestedIds.length === 1 ? "event" : "events"} you marked interested.
      </p>
    </section>
  );
}

export function SearchPanel({
  posts,
  events,
  store,
  onOpenProfile,
  onOpenEvent,
  onToast,
}: {
  posts: FeedPost[];
  events: CampusEvent[];
  store: CamporaStore;
  onOpenProfile: (authorId: string) => void;
  onOpenEvent: (e: CampusEvent) => void;
  onToast: (msg: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "posts" | "events" | "spots">("all");
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const matchedPosts = searching
    ? posts.filter(
        (p) =>
          p.text.toLowerCase().includes(q) ||
          PROFILES[p.authorId].name.toLowerCase().includes(q) ||
          p.spot.toLowerCase().includes(q)
      )
    : [];
  const matchedEvents = searching
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.about.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      )
    : [];
  const matchedSpots = searching ? SPOTS.filter((s) => s.toLowerCase().includes(q)) : [];
  const total = matchedPosts.length + matchedEvents.length + matchedSpots.length;
  const showPosts = filter === "all" || filter === "posts";
  const showEvents = filter === "all" || filter === "events";
  const showSpots = filter === "all" || filter === "spots";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]" aria-label="Search Campora">
      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
        <SearchIcon className="h-4.5 w-4.5 shrink-0 text-slate-400" />
        <span className="sr-only">Search posts, events and places</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts, events, places..."
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-slate-400"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="shrink-0 text-slate-400 hover:text-slate-600">
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </label>

      {searching && (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter search results">
            {(["all", "posts", "events", "spots"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`rounded-full border px-3 py-1 text-[13px] font-medium capitalize transition-colors ${
                  filter === f
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {total === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No matches for "{query}". Try a place like "library" or a word from a post.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {showSpots && matchedSpots.length > 0 && (
                <div>
                  <h4 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">Campus spots</h4>
                  <ul className="flex flex-wrap gap-1.5">
                    {matchedSpots.map((s) => (
                      <li key={s} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[13px] font-medium text-slate-700">
                        <PinIcon className="h-3.5 w-3.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {showEvents && matchedEvents.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400">Events</h4>
                  {matchedEvents.map((e) => (
                    <EventCard key={e.id} event={e} store={store} onOpen={onOpenEvent} />
                  ))}
                </div>
              )}
              {showPosts && matchedPosts.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400">Posts</h4>
                  {matchedPosts.map((p) => (
                    <PostCard key={p.id} post={p} store={store} onOpenProfile={onOpenProfile} onToast={onToast} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function EventModal({
  event,
  store,
  onClose,
}: {
  event: CampusEvent;
  store: CamporaStore;
  onClose: () => void;
}) {
  const interested = store.interestedIds.includes(event.id);
  const count = event.baseInterested + (interested ? 1 : 0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={event.title}>
      <button type="button" aria-label="Close event details" className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">{event.date}</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{event.category}</span>
              <span className="text-xs font-medium text-slate-400">Sample event</span>
            </div>
            <h3 className="mt-2.5 text-xl font-bold text-slate-900">{event.title}</h3>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
            <XIcon className="h-4.5 w-4.5" />
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="flex items-center gap-1.5 font-semibold text-slate-500"><CalendarIcon className="h-4 w-4" /> When</dt>
            <dd className="mt-1 text-slate-800">{event.date}, {event.time}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="flex items-center gap-1.5 font-semibold text-slate-500"><PinIcon className="h-4 w-4" /> Where</dt>
            <dd className="mt-1 text-slate-800">{event.venue}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="font-semibold text-slate-500">Organiser</dt>
            <dd className="mt-1 text-slate-800">{event.organizer}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="flex items-center gap-1.5 font-semibold text-slate-500"><StarIcon className="h-4 w-4" /> Interested</dt>
            <dd className="mt-1 text-slate-800">{count} students (sample count)</dd>
          </div>
        </dl>
        <h4 className="mt-4 text-sm font-semibold text-slate-900">About this event</h4>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{event.about}</p>
        <button
          type="button"
          onClick={() => store.toggleInterested(event.id)}
          aria-pressed={interested}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold text-white transition-colors ${
            interested ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {interested && <CheckIcon className="h-4 w-4" />}
          {interested ? "You're interested" : "Mark me interested"}
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">Demo only — this does not register you for the real event.</p>
      </div>
    </div>
  );
}

export function ProfileView({
  authorId,
  posts,
  events,
  store,
  onOpenProfile,
  onOpenEvent,
  onToast,
}: {
  authorId: string;
  posts: FeedPost[];
  events: CampusEvent[];
  store: CamporaStore;
  onOpenProfile: (authorId: string) => void;
  onOpenEvent: (e: CampusEvent) => void;
  onToast: (msg: string) => void;
}) {
  const profile = PROFILES[authorId];
  const myPosts = posts.filter((p) => p.authorId === authorId);
  const myEvents = events.filter((e) => store.interestedIds.includes(e.id));
  const following = store.followingIds.includes(authorId);
  const isMe = authorId === "you";
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]" aria-label={`${profile.name}'s profile`}>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={profile.name} color={profile.color} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.course}</p>
            <p className="text-sm text-slate-500">{profile.college}</p>
          </div>
          {!isMe && (
            <button
              type="button"
              onClick={() => store.toggleFollow(authorId)}
              aria-pressed={following}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                following ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-700">{profile.bio}</p>
        {profile.sample && (
          <p className="mt-2 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Sample profile
          </p>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Posts</dt>
            <dd className="mt-0.5 text-lg font-bold text-slate-900">{myPosts.length}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{isMe ? "Interested in" : "Followers"}</dt>
            <dd className="mt-0.5 text-lg font-bold text-slate-900">
              {isMe ? myEvents.length : profile.followers + (following ? 1 : 0)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Likes received</dt>
            <dd className="mt-0.5 text-lg font-bold text-slate-900">{myPosts.reduce((sum, p) => sum + p.likeCount, 0)}</dd>
          </div>
        </dl>
      </section>

      <section aria-label={`${profile.name}'s posts`} className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-900">{isMe ? "Your posts" : `${profile.name.split(" ")[0]}'s posts`}</h3>
        {myPosts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            {isMe ? "You have not posted yet. Your posts will appear here." : "No posts yet."}
          </p>
        ) : (
          myPosts.map((p) => (
            <PostCard key={p.id} post={p} store={store} onOpenProfile={onOpenProfile} onToast={onToast} />
          ))
        )}
      </section>

      {isMe && (
        <section aria-label="Events you are interested in" className="flex flex-col gap-3">
          <h3 className="text-lg font-bold text-slate-900">Events you're interested in</h3>
          {myEvents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              Nothing yet. Open the Events tab and tap "Interested?" on any event.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myEvents.map((e) => (
                <EventCard key={e.id} event={e} store={store} onOpen={onOpenEvent} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
