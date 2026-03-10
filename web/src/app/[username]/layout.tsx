import { ReactNode } from "react";

interface UsernameLayoutProps {
  children: ReactNode;
  params: {
    username: string;
  };
}

export default function UsernameLayout({
  children,
  params,
}: UsernameLayoutProps) {
  // TODO: Replace with dynamic username lookup from Supabase
  const username = params.username;

  return <>{children}</>;
}
