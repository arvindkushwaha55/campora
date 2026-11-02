import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL("https://arvindkushwaha55.github.io/campora/"),
  title: "Campora — Your Campus, Connected",
  description:
    "Campora is a private social platform for one college community — students share campus updates and photos, like posts, and discover classmates. Work in progress.",
  openGraph: {
    title: "Campora — Your Campus, Connected",
    description:
      "A private campus feed for verified college students — updates, photos and classmates in one place. Work in progress.",
    url: "https://arvindkushwaha55.github.io/campora/",
    siteName: "Campora",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbcfe8" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Applies the saved theme (or the system preference) before the
            page paints, so there is no light/dark flash on load. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('campora-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
