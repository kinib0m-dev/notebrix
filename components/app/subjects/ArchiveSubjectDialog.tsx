"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSubjects } from "@/lib/subjects/hooks/useSubjects";
import { Archive, Loader2, InfoIcon } from "lucide-react";
import type { Subject } from "@/lib/subjects/types";

interface ArchiveSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject;
}

export function ArchiveSubjectDialog({
  open,
  onOpenChange,
  subject,
}: ArchiveSubjectDialogProps) {
  const [isArchiving, setIsArchiving] = useState(false);
  const { archiveSubject } = useSubjects();

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      await archiveSubject(subject.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to archive subject:", error);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-md border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-orange-500" />
            Archive Subject
          </DialogTitle>
          <DialogDescription>
            Archive &quot;{subject.name}&quot; to remove it from your active
            subjects while preserving all data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-500/20 bg-orange-500/10">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Archiving will hide this subject from your active subjects list,
              but all data will be preserved. You can restore it later if
              needed.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              What happens when you archive:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Subject will be removed from your active subjects</li>
              <li>• All topics, subtopics, and materials will be preserved</li>
              <li>• You can restore the subject anytime from archives</li>
              <li>
                • If this is your current subject, you&apos;ll need to select a
                new one
              </li>
            </ul>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
              <div>
                <p className="font-medium">{subject.name}</p>
                {subject.description && (
                  <p className="text-sm text-muted-foreground">
                    {subject.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isArchiving}
            className="bg-muted/50 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleArchive}
            disabled={isArchiving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isArchiving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Archive Subject
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
