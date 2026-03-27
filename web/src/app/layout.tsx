import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ThemeProvider from "@/components/ThemeProvider";
import CookieConsent from "@/components/CookieConsent";
import { getCurrentUserProfile } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "sidequest.me — Sophie Collins",
  description:
    "Product builder, venture dabbler, and chronic side-projector. Projects, ideas, photos & more.",
  openGraph: {
    title: "sidequest.me — Sophie Collins",
    description:
      "Product builder, venture dabbler, and chronic side-projector.",
    url: "https://sidequest.me",
    siteName: "sidequest.me",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detect dashboard subdomain (my.sidequest.me)
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const isDashboard = host.startsWith("my.");

  // Fetch current user's profile for Nav (null if not logged in)
  const currentProfile = await getCurrentUserProfile();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;900&family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {isDashboard ? (
            <DashboardHeader username={currentProfile?.username ?? null} />
          ) : (
            <Nav
              currentUsername={currentProfile?.username ?? null}
              displayName={currentProfile?.display_name ?? null}
              avatarUrl={currentProfile?.avatar_url ?? null}
              accountType={(currentProfile as any)?.account_type ?? null}
            />
          )}
          {children}
          {!isDashboard && <Footer />}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
