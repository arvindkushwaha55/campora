// Shared option lists and types for Campora.

export const COURSES = ["B.Tech", "BCA", "BBA", "B.Pharmacy", "Other"] as const;
export type Course = (typeof COURSES)[number];

export const YEARS = ["1st", "2nd", "3rd", "4th", "Other"] as const;
export type Year = (typeof YEARS)[number];

export interface Profile {
  id: string;
  full_name: string;
  course: string;
  year: string;
  avatar_url: string | null;
  created_at: string;
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
  } | null;
}

export const MAX_POST_LENGTH = 1000;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
