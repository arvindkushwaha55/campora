"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { COURSES, MAX_IMAGE_SIZE_BYTES, YEARS } from "@/lib/constants";
import { AuthCard, NotConfigured, ProfileAvatarInput, inputClass, labelClass } from "@/components/common";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState<string>(COURSES[0]);
  const [year, setYear] = useState<string>(YEARS[0]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  if (!isSupabaseConfigured) return <NotConfigured />;

  function pickAvatar(file: File | null) {
    setError("");
    if (!file) {
      setAvatar(null);
      setAvatarPreview("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    setNotice("");

    const name = fullName.trim();
    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name, course, year } },
    });

    if (signUpError) {
      setSubmitting(false);
      const msg = signUpError.message.toLowerCase();
      setError(
        msg.includes("already") || msg.includes("registered")
          ? "An account with this email already exists. Please log in instead."
          : "Could not create the account. Please try again."
      );
      return;
    }

    // Email confirmation is disabled for this project, so a session normally
    // comes straight back. If it does not, the account still exists and the
    // user just needs to confirm via email and log in.
    if (!data.session || !data.user) {
      setSubmitting(false);
      setNotice(
        "Account created. If a confirmation email arrives, confirm it first — then log in."
      );
      return;
    }

    // Optional profile picture: upload it, then save its URL on the profile
    // row that the database trigger created at signup.
    if (avatar) {
      const ext = avatar.name.split(".").pop() ?? "jpg";
      const path = `${data.user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatar, { upsert: true });
      if (!uploadError) {
        const avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
        await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", data.user.id);
      }
    }

    setSubmitting(false);
    router.replace("/");
  }

  return (
    <AuthCard title="Create your account" subtitle="Join Campora with your college details.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="signup-name">Full name</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Arvind Kushwaha"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="signup-course">Course</label>
            <select
              id="signup-course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className={inputClass}
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="signup-year">Year of study</label>
            <select
              id="signup-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={inputClass}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <ProfileAvatarInput preview={avatarPreview} name={fullName || "You"} onPick={pickAvatar} />
        {error && (
          <p role="alert" className="text-sm text-red-600">{error}</p>
        )}
        {notice && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}{" "}
            <Link href="/login" className="font-semibold underline">Go to login</Link>
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-700 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
