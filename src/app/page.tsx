"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PROFILES, SPOTS, type Spot } from "@/lib/data";
import { useCamporaStore, type FeedEvent } from "@/lib/store";
import { MobileNav, Sidebar, TopBar, type View } from "@/components/shell";
import { Composer, FeedSection, PostCard } from "@/components/feed";
import { EventModal, EventsPanel, ProfileView, PulsePanel } from "@/components/panels";
import { SearchIcon, XIcon } from "@/components/icons";

type SearchType = "all" | "posts" | "events" | "spots";

export default function HomePage() {
  const store = useCamporaStore();
  const [view, setView] = useState<View>("feed");
  const [profileId, setProfileId] = useState<string>("you");
  const [spot, setSpot] = useState<Spot | "All">("All");
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [selectedEvent, setSelectedEvent] = useState<FeedEvent | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function openProfile(authorId: string) {
    setProfileId(authorId);
    setView("profile");
    window.scrollTo({ top: 0 });
  }

  function focusComposer() {
    setView("feed");
    setQuery("");
    window.scrollTo({ top: 0 });
    setTimeout(() => composerRef.current?.focus(), 60);
  }

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const matchingPosts = useMemo(() => {
    if (!searching) return [];
    return store.posts.filter((p) =>
      [PROFILES[p.authorId].name, p.text, p.spot].join(" ").toLowerCase().includes(q)
    );
  }, [store.posts, q, searching]);

  const matchingEvents = useMemo(() => {
    if (!searching) return [];
    return store.events.filter((e) =>
      [e.title, e.description, e.spot, e.category].join(" ").toLowerCase().includes(q)
    );
  }, [store.events, q, searching]);

  const matchingSpots = useMemo(() => {
    if (!searching) return [];
    return SPOTS.filter((s) => s.toLowerCase().includes(q));
  }, [q, searching]);

  // Keep the open event modal in sync with store state (e.g. Interested count)
  const liveSelectedEvent = selectedEvent
    ? (store.events.find((e) => e.id === selectedEvent.id) ?? null)
    : null;

  return (
    <div className="flex min-h-screen">
      <Sidebar view={view} onNavigate={setView} onCreate={focusComposer} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onProfile={() => openProfile("you")} />

        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 pb-24 pt-4 sm:pt-6 lg:pb-10">
          <main className="min-w-0 flex-1">
            {!store.hydrated ? (
              <div className="flex flex-col gap-4" aria-label="Loading">
                <div className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
                <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70" />
                <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70" />
              </div>
            ) : view === "profile" ? (
              <ProfileView
                profileId={profileId}
                posts={store.posts}
                store={store}
                onBack={() => setView("feed")}
                onOpenProfile={openProfile}
                onToast={showToast}
              />
            ) : view === "events" ? (
              <EventsPanel events={store.events} store={store} onOpen={setSelectedEvent} full />
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <label className="sr-only" htmlFor="campora-search">Search posts, events, and campus spots</label>
                    <input
                      id="campora-search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search posts, events, campus spots..."
                      className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[15px] shadow-[0_1px_3px_rgba(15,23,42,0.05)] outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    {searching && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Clear search"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {searching && (
                    <div className="mt-2.5 flex gap-1.5" role="group" aria-label="Search in">
                      {(["all", "posts", "events", "spots"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSearchType(t)}
                          aria-pressed={searchType === t}
                          className={`rounded-full border px-3 py-1 text-[13px] font-medium capitalize transition-colors ${
                            searchType === t
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {searching ? (
                  <section aria-label="Search results" className="flex flex-col gap-5">
                    <h2 className="text-lg font-bold text-slate-900">
                      Results for &ldquo;{query.trim()}&rdquo;
                    </h2>
                    {(searchType === "all" || searchType === "posts") && (
                      <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          Posts · {matchingPosts.length}
                        </h3>
                        {matchingPosts.length === 0 ? (
                          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                            No posts match your search.
                          </p>
                        ) : (
                          matchingPosts.map((p) => (
                            <PostCard key={p.id} post={p} store={store} onOpenProfile={openProfile} onToast={showToast} />
                          ))
                        )}
                      </div>
                    )}
                    {(searchType === "all" || searchType === "events") && (
                      <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          Events · {matchingEvents.length}
                        </h3>
                        {matchingEvents.length === 0 ? (
                          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                            No events match your search.
                          </p>
                        ) : (
                          <EventsPanel events={matchingEvents} store={store} onOpen={setSelectedEvent} />
                        )}
                      </div>
                    )}
                    {(searchType === "all" || searchType === "spots") && matchingSpots.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          Campus Spots · {matchingSpots.length}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {matchingSpots.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setSpot(s);
                                setQuery("");
                              }}
                              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                            >
                              {s} — view posts
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                ) : (
                  <>
                    <Composer store={store} onToast={showToast} textareaRef={composerRef} />
                    <FeedSection
                      posts={store.posts}
                      store={store}
                      spot={spot}
                      onSpotChange={setSpot}
                      onOpenProfile={openProfile}
                      onToast={showToast}
                    />
                  </>
                )}

                <footer className="pt-2 text-center text-[13px] leading-relaxed text-slate-400">
                  Campora — a personal mini project, Work in Progress. Frontend demo with sample
                  data; your posts and interactions are stored only in this browser.
                </footer>
              </div>
            )}
          </main>

          {view !== "profile" && (
            <div className="hidden w-80 shrink-0 flex-col gap-4 xl:flex">
              <PulsePanel
                posts={store.posts}
                events={store.events}
                onOpenProfile={openProfile}
                onOpenEvent={setSelectedEvent}
              />
              <EventsPanel events={store.events} store={store} onOpen={setSelectedEvent} />
            </div>
          )}
        </div>
      </div>

      <MobileNav view={view} onNavigate={setView} onCreate={focusComposer} />

      {liveSelectedEvent && (
        <EventModal event={liveSelectedEvent} store={store} onClose={() => setSelectedEvent(null)} />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg lg:bottom-6"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
