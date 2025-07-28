import type { Metadata } from "next";
import { UploadsView } from "@/components/app/uploads/UploadsView";

export const metadata: Metadata = {
  title: "File Uploads",
  description: "Upload and manage your learning materials",
};

export default function UploadsPage() {
  return <UploadsView />;
}
