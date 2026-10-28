import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
} satisfies P;

export function HomeIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function SearchIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}

export function PlusIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function UserIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" />
    </svg>
  );
}

export function TrashIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6.5 7 7.4 20a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9L17.5 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function ImageIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.5 17.5 4.7-4.2a1.5 1.5 0 0 1 2 0l5.8 5.2" />
    </svg>
  );
}

export function LogOutIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
      <path d="M12 12h10" />
      <path d="m18 8 4 4-4 4" />
    </svg>
  );
}

export function CameraIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8h2.2l1.8-2.5h8L17.8 8H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </svg>
  );
}

/** Deterministic soft colour for a name, used by the initials avatar fallback. */
function hueFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * A user's profile picture if they uploaded one, otherwise coloured initials.
 * Used in the sidebar, feed posts and profile pages.
 */
export function ProfileAvatar({
  name,
  avatarUrl,
  className = "h-10 w-10 text-xs",
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  const hue = hueFor(name || "?");
  return (
    <span
      aria-hidden="true"
      className={`flex ${className} shrink-0 items-center justify-center rounded-full font-bold`}
      style={{ backgroundColor: `hsl(${hue} 70% 82%)`, color: `hsl(${hue} 45% 30%)` }}
    >
      {initialsOf(name || "?")}
    </span>
  );
}
