"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { fileExtension, getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { COURSES, MAX_IMAGE_BYTES, YEARS } from "@/lib/constants";
import { AuthCard, NotConfigured, ProfileAvatarInput, inputCls, labelCls } from "@/components/common";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState<string>(COURSES[0]);
  const [year, setYear] = useState<string>(YEARS[0]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <NotConfigured />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    // --- Basic validation (the database double-checks the important rules) ---
    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (avatar) {
      if (!avatar.type.startsWith("image/")) return setError("Profile picture must be an image file.");
      if (avatar.size > MAX_IMAGE_BYTES) return setError("Profile picture must be smaller than 5 MB.");
    }

    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    try {
      // 1. Create the auth account. full_name / course / year travel as
      //    metadata; a database trigger copies them into public.profiles.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), course, year } },
      });
      if (signUpError) throw new Error(signUpError.message);
      const user = data.user;
      if (!user) throw new Error("Signup did not return a user. Please try again.");

      // 2. If the project requires email confirmation there is no session
      //    yet — say so honestly instead of pretending we are logged in.
      if (!data.session) {
        setNotice(
          "Account created. Please confirm your email from your inbox, then log in. (Tip: for local testing you can turn OFF 'Confirm email' in Supabase → Authentication → Providers → Email.)",
        );
        return;
      }

      // 3. Optional profile picture → avatars bucket, own folder only.
      if (avatar) {
        const path = `${user.id}/avatar.${fileExtension(avatar.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatar, { upsert: true, contentType: avatar.type });
        if (uploadError) throw new Error(`Profile picture upload failed: ${uploadError.message}`);
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ avatar_url: pub.publicUrl })
          .eq("id", user.id);
        if (profileError) throw new Error(profileError.message);
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Campora with your college details. It takes a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-indigo-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <ProfileAvatarInput name={fullName || "New Student"} file={avatar} onChange={setAvatar} />
        <label className="block">
          <span className={labelCls}>Full name</span>
          <input
            type="text"
            required
            autoComplete="name"
            className={inputCls}
            placeholder="e.g. Aarav Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            className={inputCls}
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            className={inputCls}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        {notice && (
          <p role="status" className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800">
            {notice}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
