"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, siteUrl, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { COURSES, MAX_IMAGE_SIZE_BYTES, YEARS } from "@/lib/constants";
import { AuthCard, NotConfigured, ProfileAvatarInput, inputClass, labelClass, useCollege } from "@/components/common";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const college = useCollege();
  const [fullName, setFullName] = useState("");
  const [collegeId, setCollegeId] = useState("");
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
    const cid = collegeId.trim();
    if (cid.length < 3) {
      setError("Please enter your College ID / enrollment number.");
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
    // Early duplicate warning (the unique College ID index is the real lock).
    const { data: available } = await supabase.rpc("college_id_available", { cid });
    if (available === false) {
      setSubmitting(false);
      setError("This College ID is already registered. If it is yours, please log in instead.");
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name, course, year, college_id: cid },
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
            ? "Signup was rejected by the server. Please check that you used your college email address and a valid, unused College ID."
            : "Could not create the account. Please try again."
      );
      return;
    }

    // With email confirmation ON, signup returns no session: the student
    // confirms the email first, then waits for admin approval of the
    // College ID. Say exactly that instead of pretending we are logged in.
    if (!data.session || !data.user) {
      setSubmitting(false);
      setNotice(
        "Account created. Please confirm your email from the link we sent you, then log in — an admin will verify your College ID before your feed unlocks."
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
          ? `For ${college.name} students only — your College ID will be verified by an admin.`
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
          <label className={labelClass} htmlFor="signup-college-id">College ID / Enrollment number</label>
          <input
            id="signup-college-id"
            type="text"
            autoComplete="off"
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            placeholder="e.g. 2500331530079"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">
            Kept private — other students never see your College ID.
          </p>
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
