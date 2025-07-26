import { useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { useSubjectStore } from "../store/useSubjectStore";
import type { CreateSubjectInput, UpdateSubjectInput, Subject } from "../types";

export function useSubjects() {
  const {
    subjects,
    currentSubject,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    setCurrentSubject,
    addSubject,
    updateSubjectInStore,
    removeSubject,
    setCreating,
    setUpdating,
    setDeleting,
    setError,
    clearError,
    clearSubject,
  } = useSubjectStore();

  // tRPC mutations
  const createMutation = trpc.subjects.create.useMutation();
  const updateMutation = trpc.subjects.update.useMutation();
  const archiveMutation = trpc.subjects.archive.useMutation();
  const deleteMutation = trpc.subjects.delete.useMutation();

  // tRPC queries
  const { isLoading: isLoadingSubjects, refetch: refetchSubjects } =
    trpc.subjects.getAll.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    });

  // Create subject
  const createSubject = useCallback(
    async (input: CreateSubjectInput) => {
      try {
        setCreating(true);
        clearError();

        const result = await createMutation.mutateAsync(input);

        if (result.success) {
          addSubject(result.data);
          toast.success(result.message);
          return result.data;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create subject";
        setError(errorMessage);
        toast.error(errorMessage);
        throw error;
      } finally {
        setCreating(false);
      }
    },
    [createMutation, addSubject, setCreating, setError, clearError]
  );

  // Update subject
  const updateSubject = useCallback(
    async (input: UpdateSubjectInput) => {
      try {
        setUpdating(true);
        clearError();

        const result = await updateMutation.mutateAsync(input);

        if (result.success) {
          updateSubjectInStore(input.id, result.data);
          toast.success(result.message);
          return result.data;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update subject";
        setError(errorMessage);
        toast.error(errorMessage);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [updateMutation, updateSubjectInStore, setUpdating, setError, clearError]
  );

  // Archive subject
  const archiveSubject = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);
        clearError();

        const result = await archiveMutation.mutateAsync({ id });

        if (result.success) {
          removeSubject(id);
          toast.success(result.message);

          // Clear current subject if it was the archived one
          if (currentSubject?.id === id) {
            clearSubject();
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to archive subject";
        setError(errorMessage);
        toast.error(errorMessage);
        throw error;
      } finally {
        setDeleting(false);
      }
    },
    [
      archiveMutation,
      removeSubject,
      setDeleting,
      setError,
      clearError,
      currentSubject,
      clearSubject,
    ]
  );

  // Delete subject permanently
  const deleteSubject = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);
        clearError();

        const result = await deleteMutation.mutateAsync({ id });

        if (result.success) {
          removeSubject(id);
          toast.success(result.message);

          // Clear current subject if it was the deleted one
          if (currentSubject?.id === id) {
            clearSubject();
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete subject";
        setError(errorMessage);
        toast.error(errorMessage);
        throw error;
      } finally {
        setDeleting(false);
      }
    },
    [
      deleteMutation,
      removeSubject,
      setDeleting,
      setError,
      clearError,
      currentSubject,
      clearSubject,
    ]
  );

  // Select subject as current
  const selectSubject = useCallback(
    (subject: Subject | null) => {
      setCurrentSubject(subject);
      if (subject) {
        toast.success(`Switched to ${subject.name}`);
      }
    },
    [setCurrentSubject]
  );

  // Get subject by ID from store
  const getSubjectById = useCallback(
    (id: string) => {
      return subjects.find((subject) => subject.id === id) || null;
    },
    [subjects]
  );

  // Check if subject exists in store
  const hasSubject = useCallback(
    (id: string) => {
      return subjects.some((subject) => subject.id === id);
    },
    [subjects]
  );

  return {
    // State
    subjects,
    currentSubject,
    isLoading: isLoading || isLoadingSubjects,
    isCreating,
    isUpdating,
    isDeleting,
    error,

    // Actions
    createSubject,
    updateSubject,
    archiveSubject,
    deleteSubject,
    selectSubject,
    clearSubject,
    clearError,

    // Utils
    getSubjectById,
    hasSubject,
    refetchSubjects,
  };
}
