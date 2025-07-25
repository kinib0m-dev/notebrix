import { AdminLayout } from "@/components/admin/AdminLayout";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/auth/routes/routes";
import { currentUser } from "@/lib/auth/server/auth";
import { HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin Dashboard - Manage users and system settings",
};

export default async function AdminPage() {
  const user = await currentUser();
  if (user?.email !== "kinib0m.dev@gmail.com")
    return redirect(`${DEFAULT_LOGIN_REDIRECT}`);
  return (
    <HydrateClient>
      <AdminLayout />
    </HydrateClient>
  );
}
