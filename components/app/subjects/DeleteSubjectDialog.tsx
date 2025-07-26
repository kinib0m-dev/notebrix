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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSubjects } from "@/lib/subjects/hooks/useSubjects";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { Subject } from "@/lib/subjects/types";

interface DeleteSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject;
}

export function DeleteSubjectDialog({
  open,
  onOpenChange,
  subject,
}: DeleteSubjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { deleteSubject } = useSubjects();

  const isConfirmed = confirmationText === subject.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      await deleteSubject(subject.id);
      onOpenChange(false);
      setConfirmationText("");
    } catch (error) {
      console.error("Failed to delete subject:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-md border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Subject
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            subject and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-destructive/20 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You are about to delete{" "}
              <strong>&quot;{subject.name}&quot;</strong>. All associated
              topics, subtopics, concepts, and uploaded materials will be
              permanently removed.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>{subject.name}</strong> to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={subject.name}
              className="bg-muted/50 border-border"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="bg-muted/50 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            variant="destructive"
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Subject"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
