import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campora — Your Campus, Connected",
  description:
    "Campora is a campus-based social platform where college students share updates, photos, and college event information. Work in progress.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
