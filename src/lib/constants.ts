/** Shared lists and types used by the auth, profile and feed code. */

export const COURSES = ["B.Tech", "BCA", "BBA", "B.Pharmacy", "Other"] as const;
export const YEARS = ["1st", "2nd", "3rd", "4th", "Other"] as const;

export type Course = (typeof COURSES)[number];
export type Year = (typeof YEARS)[number];

/** A row from the public.profiles table. */
export type Profile = {
  id: string;
  full_name: string;
  course: string;
  year: string;
  avatar_url: string | null;
  created_at: string;
};

/** A row from the public.posts table, with the author's profile joined in. */
export type Post = {
  id: string;
  user_id: string;
  text: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    course?: string;
    year?: string;
  } | null;
};

/** Validation limits shared by the forms (the database enforces them too). */
export const MAX_POST_LENGTH = 1000;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
