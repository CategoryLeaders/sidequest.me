import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { getProfileByUsername } from "@/lib/profiles";

interface UsernameLayoutProps {
  children: ReactNode;
  params: Promise<{ username: string }>;
}

/**
 * Layout for all /[username]/* routes.
 * Validates the username exists in the database — returns 404 if not.
 * Profile data is fetched independently in each page (React.cache deduplicates).
 */
export default async function UsernameLayout({
  children,
  params,
}: UsernameLayoutProps) {
  const { username } = await params;

  const profile = await getProfileByUsername(username);
  if (!profile) {
    notFound();
  }

  return <>{children}</>;
}
