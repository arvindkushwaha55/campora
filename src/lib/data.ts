// Campora sample data — clearly labelled demonstration content.
// There is no backend yet: everything in this file is static sample data
// used to develop and demonstrate the frontend. Real student data will
// only exist once the Supabase phase is implemented.

export const SPOTS = [
  "Library",
  "Canteen",
  "Main Block",
  "Sports Ground",
  "Auditorium",
  "Hostel",
] as const;

export type Spot = (typeof SPOTS)[number];

export interface Profile {
  id: string;
  name: string;
  course: string;
  bio: string;
  color: string; // avatar background
}

export interface CommentItem {
  id: string;
  authorId: string;
  text: string;
  timeLabel: string;
}

export type CoverIcon = "library" | "robot" | "code" | "food" | "trophy";

export interface Post {
  id: string;
  authorId: string;
  text: string;
  spot: Spot;
  timeLabel: string;
  hoursAgo: number; // used for Latest sorting of sample posts
  cover?: { icon: CoverIcon; label: string };
  baseLikes: number;
  sampleComments: CommentItem[];
  sample?: boolean; // true for the posts in this file
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  day: string;
  mon: string;
  time: string;
  spot: Spot;
  category: "Tech" | "Sports" | "Workshop" | "Cultural";
  baseInterested: number;
}

export const CURRENT_USER_ID = "you";

export const PROFILES: Record<string, Profile> = {
  you: {
    id: "you",
    name: "Arvind Kushwaha",
    course: "B.Tech AI & ML · RKGIT",
    bio: "Building Campora — a small campus social app — while learning web development.",
    color: "#4f46e5",
  },
  ananya: {
    id: "ananya",
    name: "Ananya Sharma",
    course: "CSE · 2nd Year",
    bio: "Book lover. Usually found on the library's 2nd floor.",
    color: "#db2777",
  },
  rohit: {
    id: "rohit",
    name: "Rohit Verma",
    course: "Mechanical · 3rd Year",
    bio: "Robotics club member. Mech by degree, builder by heart.",
    color: "#d97706",
  },
  sneha: {
    id: "sneha",
    name: "Sneha Patel",
    course: "ECE · 1st Year",
    bio: "New here. Into coding contests and late-night chai.",
    color: "#059669",
  },
  kabir: {
    id: "kabir",
    name: "Kabir Singh",
    course: "CSE · 3rd Year",
    bio: "Canteen reviewer (unofficial). Cricket team all-rounder.",
    color: "#2563eb",
  },
  ishita: {
    id: "ishita",
    name: "Ishita Rao",
    course: "AI & ML · 2nd Year",
    bio: "Cultural society volunteer. Dance, drama, and data.",
    color: "#7c3aed",
  },
};

export const SAMPLE_POSTS: Post[] = [
  {
    id: "p1",
    authorId: "ananya",
    text: "The library finally has the new seating area on the 2nd floor. Best spot on campus to study before mid-sems — quiet, good light, and charging points at every table.",
    spot: "Library",
    timeLabel: "2h ago",
    hoursAgo: 2,
    cover: { icon: "library", label: "Central Library · 2nd Floor" },
    baseLikes: 24,
    sampleComments: [
      { id: "p1c1", authorId: "sneha", text: "Went there today, the window seats are the best.", timeLabel: "1h ago" },
      { id: "p1c2", authorId: "kabir", text: "Is it open till 8 in the evening?", timeLabel: "1h ago" },
    ],
    sample: true,
  },
  {
    id: "p2",
    authorId: "rohit",
    text: "Our robotics club just finished the line-follower bot for the tech fest. Testing it on the main ground tomorrow at 4 PM — come watch if you're around!",
    spot: "Sports Ground",
    timeLabel: "5h ago",
    hoursAgo: 5,
    cover: { icon: "robot", label: "Robotics Club · Test Run" },
    baseLikes: 41,
    sampleComments: [
      { id: "p2c1", authorId: "ishita", text: "Saw the trial yesterday, it is fast this time.", timeLabel: "4h ago" },
      { id: "p2c2", authorId: "ananya", text: "All the best for the fest!", timeLabel: "3h ago" },
      { id: "p2c3", authorId: "kabir", text: "Will be there at 4. Bringing the first-years along.", timeLabel: "3h ago" },
    ],
    sample: true,
  },
  {
    id: "p3",
    authorId: "kabir",
    text: "Honest review: the canteen's new aloo paratha combo is actually worth the money. Queue is long after 1 PM though, so go a little early.",
    spot: "Canteen",
    timeLabel: "8h ago",
    hoursAgo: 8,
    cover: { icon: "food", label: "College Canteen" },
    baseLikes: 33,
    sampleComments: [
      { id: "p3c1", authorId: "rohit", text: "The queue part is painfully true.", timeLabel: "7h ago" },
      { id: "p3c2", authorId: "sneha", text: "Tried it today — approved. The chutney is new too.", timeLabel: "6h ago" },
    ],
    sample: true,
  },
  {
    id: "p4",
    authorId: "sneha",
    text: "First hackathon experience done! Didn't win, but learned more in 24 hours than in a whole month of classes. Already waiting for the next one.",
    spot: "Main Block",
    timeLabel: "Yesterday",
    hoursAgo: 26,
    cover: { icon: "code", label: "Hackathon · Main Block Labs" },
    baseLikes: 18,
    sampleComments: [
      { id: "p4c1", authorId: "ananya", text: "The first one is always the hardest. Well done!", timeLabel: "Yesterday" },
    ],
    sample: true,
  },
  {
    id: "p5",
    authorId: "ishita",
    text: "Cultural fest auditions are this Friday in the auditorium. Dance, music, and drama teams are all selecting. If you were waiting for a sign — this is it.",
    spot: "Auditorium",
    timeLabel: "Yesterday",
    hoursAgo: 30,
    cover: { icon: "trophy", label: "Cultural Fest · Auditions" },
    baseLikes: 27,
    sampleComments: [],
    sample: true,
  },
];

export const SAMPLE_EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "Annual Tech Fest — Day 1",
    description:
      "The college's annual technical festival opens with project exhibitions, robotics competitions, and coding contests across the main block. Open to students of all branches; carry your college ID for entry.",
    day: "02",
    mon: "Nov",
    time: "10:00 AM onwards",
    spot: "Main Block",
    category: "Tech",
    baseInterested: 132,
  },
  {
    id: "e2",
    title: "Inter-College Cricket Match",
    description:
      "Our college team plays the visiting team in a 20-over friendly. Seating is on the ground's west side; the canteen will run a snack counter nearby.",
    day: "08",
    mon: "Nov",
    time: "9:00 AM",
    spot: "Sports Ground",
    category: "Sports",
    baseInterested: 98,
  },
  {
    id: "e3",
    title: "AI & ML Workshop",
    description:
      "A hands-on introductory workshop on machine learning basics: data, models, and a small live demo. Bring a laptop if you can; no prior ML experience needed.",
    day: "15",
    mon: "Nov",
    time: "11:00 AM",
    spot: "Library",
    category: "Workshop",
    baseInterested: 64,
  },
  {
    id: "e4",
    title: "Cultural Fest Auditions",
    description:
      "Auditions for dance, music, and drama teams for this year's cultural fest. Register at the auditorium desk on the day itself; solo and group entries both welcome.",
    day: "21",
    mon: "Nov",
    time: "3:00 PM",
    spot: "Auditorium",
    category: "Cultural",
    baseInterested: 57,
  },
];
