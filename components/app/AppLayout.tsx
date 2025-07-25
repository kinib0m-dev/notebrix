"use client";

import { UserMenu } from "./UserMenu";

interface AppLayoutProps {
  children: React.ReactNode;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function AppLayout({
  children,
  name,
  email,
  image,
}: AppLayoutProps) {
  return (
    <div className="w-full">
      <div className="flex min-h-screen">
        <UserMenu name={name} image={image} email={email} />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
