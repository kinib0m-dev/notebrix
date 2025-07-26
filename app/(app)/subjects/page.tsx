import { SubjectsView } from "@/components/app/subjects/SubjectsView";
import { HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subjects",
  description: "Manage your subjects",
};

export default function SubjectsPage() {
  return (
    <HydrateClient>
      <SubjectsView />
    </HydrateClient>
  );
}
