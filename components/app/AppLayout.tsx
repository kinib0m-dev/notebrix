"use client";

import { Navbar } from "./navbar/Navbar";

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
    <div className="min-h-screen bg-background">
      <Navbar name={name} email={email} image={image} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
