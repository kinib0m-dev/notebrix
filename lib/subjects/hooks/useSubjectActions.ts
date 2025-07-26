import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useSubjects } from "./useSubjects";
import type { CreateSubjectInput, UpdateSubjectInput } from "../types";

export function useSubjectActions() {
  const router = useRouter();
  const {
    createSubject,
    updateSubject,
    archiveSubject,
    deleteSubject,
    selectSubject,
    currentSubject,
    subjects,
  } = useSubjects();

  // Create and immediately select a new subject
  const createAndSelectSubject = useCallback(
    async (input: CreateSubjectInput) => {
      try {
        const newSubject = await createSubject(input);
        if (newSubject) {
          selectSubject(newSubject);
          return newSubject;
        }
      } catch (error) {
        throw error;
      }
    },
    [createSubject, selectSubject]
  );

  // Switch to a different subject
  const switchSubject = useCallback(
    (subjectId: string) => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (subject) {
        selectSubject(subject);
        router.push(`/app/subjects/${subjectId}`);
      } else {
        console.error("Subject not found:", subjectId);
      }
    },
    [subjects, selectSubject, router]
  );

  // Archive current subject and redirect
  const archiveCurrentSubject = useCallback(async () => {
    if (!currentSubject) return;

    try {
      await archiveSubject(currentSubject.id);
      router.push("/app/onboarding");
    } catch (error) {
      throw error;
    }
  }, [currentSubject, archiveSubject, router]);

  // Delete current subject and redirect
  const deleteCurrentSubject = useCallback(async () => {
    if (!currentSubject) return;

    try {
      await deleteSubject(currentSubject.id);
      router.push("/app/onboarding");
    } catch (error) {
      throw error;
    }
  }, [currentSubject, deleteSubject, router]);

  // Update current subject
  const updateCurrentSubject = useCallback(
    async (updates: Omit<UpdateSubjectInput, "id">) => {
      if (!currentSubject) return;

      try {
        const updated = await updateSubject({
          id: currentSubject.id,
          ...updates,
        });
        return updated;
      } catch (error) {
        throw error;
      }
    },
    [currentSubject, updateSubject]
  );

  // Check if user has any subjects
  const hasSubjects = subjects.length > 0;

  // Check if user should be redirected to onboarding
  const shouldRedirectToOnboarding = !currentSubject && !hasSubjects;

  return {
    // Actions
    createAndSelectSubject,
    switchSubject,
    archiveCurrentSubject,
    deleteCurrentSubject,
    updateCurrentSubject,
    // State checks
    hasSubjects,
    shouldRedirectToOnboarding,
    currentSubject,
    subjects,
  };
}
