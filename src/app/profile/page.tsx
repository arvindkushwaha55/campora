"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { fileExtension, getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { COURSES, MAX_IMAGE_BYTES, YEARS, type Post, type Profile } from "@/lib/constants";
import { AuthGate, LoadingScreen, NotConfigured, ProfileAvatarInput, inputCls, labelCls } from "@/components/common";
import { PostCard } from "@/components/feed";
import { ProfileAvatar } from "@/components/icons";
import { AppShell } from "@/components/shell";

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProfileInner />
    </Suspense>
  );
}

function ProfileInner() {
  const params = useSearchParams();
  const otherId = params.get("id");
  return (
    <AppShell>
      <AuthGate>{otherId ? <OtherProfile userId={otherId} /> : <OwnProfile />}</AuthGate>
    </AppShell>
  );
}

/** Fetches one user's posts (newest first) for the profile pages. */
function useUserPosts(userId: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("posts")
      .select("id, user_id, text, image_url, created_at, profiles(full_name, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setPosts((data as Post[] | null) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { posts, loading, reload: load };
}

function PostList({
  posts,
  loading,
  emptyText,
  onChanged,
}: {
  posts: Post[];
  loading: boolean;
  emptyText: string;
  onChanged?: () => void;
}) {
  if (loading) return <p className="py-8 text-center text-sm text-stone-500">Loading posts…</p>;
  if (posts.length === 0)
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center">
        <p className="text-sm font-medium text-stone-500">{emptyText}</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDeleted={onChanged} />
      ))}
    </div>
  );
}

function OwnProfile() {
  const { profile, session, refreshProfile } = useAuth();
  const router = useRouter();
  const userId = session?.user.id ?? null;
  const { posts, loading, reload } = useUserPosts(userId);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [course, setCourse] = useState<string>(COURSES[0]);
  const [year, setYear] = useState<string>(YEARS[0]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <NotConfigured />;
  if (!profile)
    return <p className="py-16 text-center text-sm text-stone-500">Loading your profile…</p>;

  function startEditing() {
    if (!profile) return;
    setFullName(profile.full_name);
    setCourse(profile.course);
    setYear(profile.year);
    setAvatar(null);
    setError("");
    setEditing(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (avatar) {
      if (!avatar.type.startsWith("image/")) return setError("Profile picture must be an image file.");
      if (avatar.size > MAX_IMAGE_BYTES) return setError("Profile picture must be smaller than 5 MB.");
    }
    const supabase = getSupabase();
    if (!supabase || !profile) return;
    setBusy(true);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatar) {
        const path = `${profile.id}/avatar.${fileExtension(avatar.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatar, { upsert: true, contentType: avatar.type });
        if (uploadError) throw new Error(`Profile picture upload failed: ${uploadError.message}`);
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        // Cache-bust so the new picture shows immediately everywhere.
        avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), course, year, avatar_url: avatarUrl })
        .eq("id", profile.id);
      if (updateError) throw new Error(updateError.message);
      await refreshProfile();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-stone-900/5 bg-white p-6 shadow-sm">
        {!editing ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <ProfileAvatar
              name={profile.full_name}
              avatarUrl={profile.avatar_url}
              className="h-20 w-20 text-xl"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black tracking-tight">{profile.full_name}</h1>
              <p className="mt-0.5 text-sm font-medium text-stone-500">
                {profile.course} · {profile.year} year
              </p>
              <p className="truncate text-sm text-stone-500">{session?.user.email}</p>
              <p className="mt-1 text-xs text-stone-400">
                On Campora since{" "}
                {new Date(profile.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={startEditing}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Edit profile
            </button>
          </div>
        ) : (
          <form onSubmit={onSave} className="flex flex-col gap-4">
            <h2 className="text-lg font-black tracking-tight">Edit profile</h2>
            <ProfileAvatarInput
              name={fullName || profile.full_name}
              currentUrl={profile.avatar_url}
              file={avatar}
              onChange={setAvatar}
            />
            <label className="block">
              <span className={labelCls}>Full name</span>
              <input
                type="text"
                required
                className={inputCls}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Course</span>
                <select className={inputCls} value={course} onChange={(e) => setCourse(e.target.value)}>
                  {COURSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Year</span>
                <select className={inputCls} value={year} onChange={(e) => setYear(e.target.value)}>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y} year
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
                {error}
              </p>
            )}
            <div className="flex gap-2.5">
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl bg-stone-900/5 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-900/10"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-black tracking-tight">Your posts</h2>
        <PostList
          posts={posts}
          loading={loading}
          emptyText="You have not posted yet. Share your first campus update from the home feed."
          onChanged={reload}
        />
      </section>

      <button
        type="button"
        onClick={() => router.push("/")}
        className="self-start text-sm font-semibold text-indigo-700 hover:underline"
      >
        ← Back to the campus feed
      </button>
    </div>
  );
}

function OtherProfile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missing, setMissing] = useState(false);
  const { posts, loading } = useUserPosts(userId);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase
      .from("profiles")
      .select("id, full_name, course, year, avatar_url, created_at")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
        else setMissing(true);
      });
  }, [userId]);

  if (missing)
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
        <p className="font-bold">Profile not found</p>
        <Link href="/" className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:underline">
          Back to the campus feed
        </Link>
      </div>
    );
  if (!profile)
    return <p className="py-16 text-center text-sm text-stone-500">Loading profile…</p>;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-stone-900/5 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <ProfileAvatar
            name={profile.full_name}
            avatarUrl={profile.avatar_url}
            className="h-20 w-20 text-xl"
          />
          <div>
            <h1 className="text-2xl font-black tracking-tight">{profile.full_name}</h1>
            <p className="mt-0.5 text-sm font-medium text-stone-500">
              {profile.course} · {profile.year} year
            </p>
            <p className="mt-1 text-xs text-stone-400">
              On Campora since{" "}
              {new Date(profile.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-base font-black tracking-tight">Posts by {profile.full_name}</h2>
        <PostList posts={posts} loading={loading} emptyText="No posts yet." />
      </section>
    </div>
  );
}
