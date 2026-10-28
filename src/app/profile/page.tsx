"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
  COURSES,
  MAX_IMAGE_SIZE_BYTES,
  YEARS,
  type Post,
  type Profile,
} from "@/lib/constants";
import { AppShell } from "@/components/shell";
import { AuthGate, LoadingScreen, ProfileAvatarInput, inputClass, labelClass } from "@/components/common";
import { PostCard } from "@/components/feed";
import { ProfileAvatar } from "@/components/icons";

const POST_SELECT =
  "id, user_id, text, image_url, created_at, profiles(full_name, avatar_url, course, year)";

function PostsList({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setPosts((data as unknown as Post[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingScreen label="Loading posts" />;
  if (posts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
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
        .select("id, full_name, course, year, avatar_url, created_at")
        .eq("id", id)
        .single();
      setProfile((data as Profile) ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <LoadingScreen label="Loading profile" />;
  if (!profile) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
        <p className="font-semibold text-slate-700">Profile not found</p>
        <Link href="/" className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:underline">
          Back to the feed
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="self-start rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
        ← Back to feed
      </Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]" aria-label={`${profile.full_name}'s profile`}>
        <div className="flex items-center gap-4">
          <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
            <p className="text-sm text-slate-500">
              {profile.course} · {profile.year} year
            </p>
          </div>
        </div>
      </section>
      <h3 className="text-lg font-bold text-slate-900">{profile.full_name.split(" ")[0]}&rsquo;s posts</h3>
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
        .update({ full_name: name, course, year, avatar_url: avatarUrl })
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]" aria-label="My profile">
        <div className="flex flex-wrap items-center gap-4">
          <ProfileAvatar name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
            <p className="text-sm text-slate-500">
              {profile.course} · {profile.year} year
            </p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Edit profile
            </button>
          )}
        </div>

        {saved && !editing && (
          <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Profile saved.
          </p>
        )}

        {editing && (
          <form onSubmit={handleSave} className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5" noValidate>
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
            <ProfileAvatarInput preview={avatarPreview} name={fullName || profile.full_name} onPick={pickAvatar} />
            {error && (
              <p role="alert" className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <h3 className="text-lg font-bold text-slate-900">Your posts</h3>
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
