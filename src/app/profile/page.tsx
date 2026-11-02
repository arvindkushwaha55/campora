"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
  COURSES,
  MAX_BIO_LENGTH,
  MAX_IMAGE_SIZE_BYTES,
  YEARS,
  type Post,
  type Profile,
} from "@/lib/constants";
import { AppShell } from "@/components/shell";
import { AuthGate, LoadingScreen, ProfileAvatarInput, inputClass, labelClass } from "@/components/common";
import { PostCard } from "@/components/feed";
import { ProfileAvatar } from "@/components/icons";

const POST_COLUMNS = "id, user_id, text, image_url, created_at";

function PostsList({ userId }: { userId: string }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    // Two plain queries merged in the client — the same approach as the
    // feed (a PostgREST embed for the author proved unreliable live).
    const { data } = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const rows = (data as unknown as Omit<Post, "profiles">[]) ?? [];
    const { data: author } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, course, year")
      .eq("id", userId)
      .maybeSingle();
    const merged: Post[] = rows.map((r) => ({
      ...r,
      profiles: author
        ? {
            full_name: author.full_name,
            avatar_url: author.avatar_url,
            course: author.course,
            year: author.year,
          }
        : null,
    }));
    setPosts(merged);
    if (merged.length > 0) {
      const ids = merged.map((post) => post.id);
      const { data: likeRows } = await supabase
        .from("likes")
        .select("post_id, user_id")
        .in("post_id", ids);
      if (likeRows) {
        const counts: Record<string, number> = {};
        const mine = new Set<string>();
        for (const id of ids) counts[id] = 0;
        for (const row of likeRows) {
          counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
          if (row.user_id === user?.id) mine.add(row.post_id);
        }
        setLikeCounts(counts);
        setMyLikes(mine);
      }
    }
    setLoading(false);
  }, [userId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleLike(post: Post) {
    if (!supabase || !user) return;
    const liked = myLikes.has(post.id);
    setMyLikes((prev) => {
      const next = new Set(prev);
      if (liked) next.delete(post.id);
      else next.add(post.id);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [post.id]: Math.max(0, (prev[post.id] ?? 0) + (liked ? -1 : 1)),
    }));
    const { error: likeError } = liked
      ? await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id)
      : await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
    if (likeError) {
      setMyLikes((prev) => {
        const next = new Set(prev);
        if (liked) next.add(post.id);
        else next.delete(post.id);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [post.id]: Math.max(0, (prev[post.id] ?? 0) + (liked ? 1 : -1)),
      }));
    }
  }

  if (loading) return <LoadingScreen label="Loading posts" />;
  if (posts.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        No posts yet.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          likeCount={likeCounts[post.id] ?? 0}
          likedByMe={myLikes.has(post.id)}
          onToggleLike={toggleLike}
          onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
        />
      ))}
    </div>
  );
}

function OtherProfile({ id }: { id: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, course, year, avatar_url, bio, verification_status, is_admin, created_at")
        .eq("id", id)
        .single();
      setProfile((data as Profile) ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <LoadingScreen label="Loading profile" />;
  if (!profile) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-10 text-center">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Profile not found</p>
        <Link href="/" className="mt-2 inline-block text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
          Back to the feed
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="self-start rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-slate-50">
        ← Back to feed
      </Link>
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)]" aria-label={`${profile.full_name}'s profile`}>
        <div className="h-24 bg-gradient-to-r from-pink-300 via-rose-300 to-indigo-400 dark:from-pink-500/40 dark:via-rose-500/30 dark:to-indigo-500/40" aria-hidden="true" />
        <div className="px-5 pb-5">
          <div className="-mt-9">
            <span className="inline-block rounded-full ring-4 ring-white dark:ring-slate-900">
              <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
            </span>
          </div>
          <h2 className="mt-3 text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{profile.full_name}</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {profile.course} · {profile.year} year
          </p>
          <span className="mt-2.5 inline-block rounded-full bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            ✓ Verified student
          </span>
          {profile.bio && (
            <p className="mt-2.5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{profile.bio}</p>
          )}
        </div>
      </section>
      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">{profile.full_name.split(" ")[0]}&rsquo;s posts</h3>
      <PostsList userId={profile.id} />
    </div>
  );
}

function MyProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [course, setCourse] = useState<string>(COURSES[0]);
  const [year, setYear] = useState<string>(YEARS[0]);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!profile || !user) return <LoadingScreen label="Loading your profile" />;

  function startEditing() {
    if (!profile) return;
    setFullName(profile.full_name);
    setCourse(profile.course);
    setYear(profile.year);
    setBio(profile.bio ?? "");
    setAvatar(null);
    setAvatarPreview(profile.avatar_url ?? "");
    setError("");
    setSaved(false);
    setEditing(true);
  }

  function pickAvatar(file: File | null) {
    setError("");
    if (!file) {
      setAvatar(null);
      setAvatarPreview(profile?.avatar_url ?? "");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Profile picture must be an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Profile picture is too large — please keep it under 5 MB.");
      return;
    }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user || !profile) return;
    setError("");
    setSaved(false);
    const name = fullName.trim();
    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatar) {
        const ext = avatar.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatar, { upsert: true });
        if (uploadError) throw new Error("Photo upload failed. Please try again.");
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
        // Cache-bust so the new photo shows immediately everywhere.
        avatarUrl = `${avatarUrl}?v=${Date.now()}`;
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: name, course, year, bio: bio.trim() || null, avatar_url: avatarUrl })
        .eq("id", user.id);
      if (updateError) throw new Error("Could not save your profile. Please try again.");
      await refreshProfile();
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)]" aria-label="My profile">
        <div className="h-24 bg-gradient-to-r from-pink-300 via-rose-300 to-indigo-400 dark:from-pink-500/40 dark:via-rose-500/30 dark:to-indigo-500/40" aria-hidden="true" />
        <div className="px-5 pb-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="-mt-9 shrink-0">
            <span className="inline-block rounded-full ring-4 ring-white dark:ring-slate-900">
              <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-2">
            <h2 className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{profile.full_name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {profile.course} · {profile.year} year
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                profile.verification_status === "approved"
                  ? "bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300"
                  : profile.verification_status === "rejected"
                    ? "bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-300"
                    : "bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300"
              }`}
            >
              {profile.verification_status === "approved"
                ? "✓ Verified student"
                : profile.verification_status === "rejected"
                  ? "Verification not approved"
                  : "Verification pending"}
              {profile.is_admin ? " · Admin" : ""}
            </span>
            {profile.bio && (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{profile.bio}</p>
            )}
          </div>
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/20 px-5 py-2 text-sm font-semibold text-white transition-all hover:from-indigo-700 hover:to-violet-700 active:scale-95"
            >
              Edit profile
            </button>
          )}
        </div>

        {saved && !editing && (
          <p role="status" className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-400/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            Profile saved.
          </p>
        )}

        {editing && (
          <form onSubmit={handleSave} className="mt-5 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-5" noValidate>
            <div>
              <label className={labelClass} htmlFor="profile-name">Full name</label>
              <input
                id="profile-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="profile-course">Course</label>
                <select id="profile-course" value={course} onChange={(e) => setCourse(e.target.value)} className={inputClass}>
                  {COURSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-year">Year of study</label>
                <select id="profile-year" value={year} onChange={(e) => setYear(e.target.value)} className={inputClass}>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="profile-bio">Bio (optional)</label>
              <textarea
                id="profile-bio"
                rows={2}
                maxLength={MAX_BIO_LENGTH}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A line about you — branch, interests, anything."
                className={`${inputClass} resize-none`}
              />
              <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">{bio.length}/{MAX_BIO_LENGTH}</p>
            </div>
            <ProfileAvatarInput preview={avatarPreview} name={fullName || profile.full_name} onPick={pickAvatar} />
            {error && (
              <p role="alert" className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm px-5 py-2 text-sm font-semibold text-white transition-colors hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        </div>
      </section>

      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">Your posts</h3>
      <PostsList userId={profile.id} />
    </div>
  );
}

function ProfileRouter() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const id = searchParams.get("id");
  if (id && user && id !== user.id) return <OtherProfile id={id} />;
  return <MyProfile />;
}

export default function ProfilePage() {
  return (
    <AuthGate>
      <AppShell>
        <Suspense fallback={<LoadingScreen label="Loading profile" />}>
          <ProfileRouter />
        </Suspense>
      </AppShell>
    </AuthGate>
  );
}
