import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Campora — Your Campus, Connected",
  description:
    "Campora is a simple full-stack campus social app for college students: create an account, share posts and photos, and see what is happening around your campus.",
  openGraph: {
    title: "Campora — Your Campus, Connected",
    description:
      "A simple campus social app for college students: accounts, profiles, posts and photos from your campus.",
    type: "website",
    siteName: "Campora",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbcfe8",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fdf7f2] text-stone-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
