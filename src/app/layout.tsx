import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://arvindkushwaha55.github.io/campora/"),
  title: "Campora — Your Campus, Connected",
  description:
    "Campora is a campus-based social platform where college students share updates, photos, and college event information. Work in progress.",
  openGraph: {
    title: "Campora — Your Campus, Connected",
    description:
      "A campus-based social platform for college students — updates, events and campus life in one feed. Work in progress.",
    url: "https://arvindkushwaha55.github.io/campora/",
    siteName: "Campora",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbcfe8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
