"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, siteUrl, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { COURSES, MAX_IMAGE_SIZE_BYTES, YEARS } from "@/lib/constants";
import { AuthCard, NotConfigured, PasswordInput, ProfileAvatarInput, inputClass, labelClass, useCollege } from "@/components/common";
import { NAME_ERROR_MESSAGE, NSFW_ERROR_MESSAGE, containsAbuse } from "@/lib/moderation";
import { imageLooksInappropriate } from "@/lib/image-moderation";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const college = useCollege();
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

  async function pickAvatar(file: File | null) {
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
    // Same on-device screening as post photos.
    if (await imageLooksInappropriate(file)) {
      setError(NSFW_ERROR_MESSAGE);
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
    if (containsAbuse(name)) {
      setError(NAME_ERROR_MESSAGE);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    // Friendly early warning only — the database trigger enforces the same
    // domain rule on the server side, so it cannot be bypassed.
    const domain = college?.email_domain?.trim().toLowerCase();
    if (domain && email.trim().toLowerCase().split("@")[1] !== domain) {
      setError(`Please use your college email address (@${domain}).`);
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
      options: {
        data: { full_name: name, course, year },
        emailRedirectTo: siteUrl("/"),
      },
    });

    if (signUpError) {
      setSubmitting(false);
      const msg = signUpError.message.toLowerCase();
      setError(
        msg.includes("already") || msg.includes("registered")
          ? "An account with this email already exists. Please log in instead."
          : msg.includes("database error")
            ? "Signup was rejected by the server. Please check that you used your college email address."
            : "Could not create the account. Please try again."
      );
      return;
    }

    // With email confirmation ON, signup returns no session: the student
    // confirms the email first, and the account is active immediately
    // after that. Say exactly that instead of pretending we are logged in.
    // (A profile picture chosen here cannot be uploaded without a session,
    // so point the student to their profile for it.)
    if (!data.session || !data.user) {
      setSubmitting(false);
      setNotice(
        "Account created. Please confirm your email from the link we sent you, then log in — your campus feed unlocks as soon as your email is confirmed. You can add your profile photo from your profile page after logging in."
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
    <AuthCard
      title="Create your account"
      subtitle={
        college
          ? `For ${college.name} students only — sign up with your college email.`
          : "Join Campora with your college details."
      }
    >
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
          <label className={labelClass} htmlFor="signup-email">College email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={college?.email_domain ? `you@${college.email_domain}` : "you@college.edu"}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="signup-password">Password</label>
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            placeholder="At least 6 characters"
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
          <p role="status" className="rounded-lg bg-emerald-50 dark:bg-emerald-400/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {notice}{" "}
            <Link href="/login" className="font-semibold underline">Go to login</Link>
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-indigo-600 px-4 py-3 text-[15px] font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        A teacher or just visiting?{" "}
        <Link href="/login" className="font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
          Continue as a guest
        </Link>
        <br />
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
