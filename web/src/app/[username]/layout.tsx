import { ReactNode } from "react";

interface UsernameLayoutProps {
  children: ReactNode;
  params: {
    username: string;
  };
}

export default async function UsernameLayout({
  children,
  params,
}: UsernameLayoutProps) {
  const { username } = await Promise.resolve(params);
  void username; // available for future use (e.g. Supabase profile lookup)
  return <>{children}</>;
}
