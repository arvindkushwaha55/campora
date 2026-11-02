// Shared option lists and types for Campora.

export const COURSES = ["B.Tech", "BCA", "BBA", "B.Pharmacy", "Other"] as const;
export type Course = (typeof COURSES)[number];

export const YEARS = ["1st", "2nd", "3rd", "4th", "Other"] as const;
export type Year = (typeof YEARS)[number];

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  course: string;
  year: string;
  avatar_url: string | null;
  bio: string | null;
  verification_status: VerificationStatus;
  is_admin: boolean;
  is_guest: boolean;
  created_at: string;
}

/** The configured college (public.colleges) — one row for now. */
export interface College {
  id: string;
  name: string;
  email_domain: string | null;
  is_active: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  text: string;
  image_url: string | null;
  created_at: string;
  // Joined from the profiles table when the feed is loaded.
  profiles: {
    full_name: string;
    avatar_url: string | null;
    course: string;
    year: string;
    is_guest?: boolean;
  } | null;
}

/**
 * Shared surface style for cards across the app (feed, discovery, profile,
 * rails) so every screen reads as one product. Compose with padding and
 * any hover/transition classes at the call site.
 */
export const cardClass =
  "rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.18)]";

export const MAX_POST_LENGTH = 1000;
export const MAX_BIO_LENGTH = 160;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const FEED_PAGE_SIZE = 10;
