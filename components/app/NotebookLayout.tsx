"use client";
import Link from "next/link";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { File, Upload } from "lucide-react";
import { useSubjectStore } from "@/lib/subjects/store/useSubjectStore";
import { usePathname } from "next/navigation";

interface NotebookLayoutProps {
  children: React.ReactNode;
}

export function NotebookLayout({ children }: NotebookLayoutProps) {
  const { currentSubject } = useSubjectStore();
  const pathname = usePathname();

  const subjectColor = currentSubject ? currentSubject.color : "#3B82F6";

  return (
    <div className="flex justify-center p-8 min-h-screen">
      <Card
        className="
        max-w-4xl w-full
        bg-amber-50 dark:bg-slate-800
        shadow-lg
        border-l-4
        relative
        before:content-[''] 
        before:absolute 
        before:left-8 
        before:top-0 
        before:bottom-0 
        before:w-px 
        before:bg-blue-300 dark:before:bg-slate-500
        pl-12 pr-8 py-8
      "
        style={{
          borderLeftColor: subjectColor,
        }}
      >
        <div className="flex justify-between items-start mb-6">
          <Link href={"/subjects"} className="flex gap-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg"
              style={{
                backgroundColor: subjectColor,
              }}
            >
              {currentSubject
                ? currentSubject.name.charAt(0).toUpperCase()
                : ""}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {currentSubject ? currentSubject.name : ""}
              </h1>
              <p className="text-muted-foreground text-xs">
                Click to change subject
              </p>
            </div>
          </Link>

          {!pathname.startsWith("/uploads") ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/uploads" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload a file
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/notebook" className="flex items-center gap-2">
                <File className="h-4 w-4" />
                Notebook
              </Link>
            </Button>
          )}
        </div>

        {children}
      </Card>
    </div>
  );
}
