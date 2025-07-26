import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Subject, SubjectStore } from "../types";

// Define the initial state
const initialState = {
  currentSubject: null,
  subjects: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

export const useSubjectStore = create<SubjectStore>()(
  persist(
    immer((set) => ({
      // Initial state
      ...initialState,

      // Subject management actions
      setCurrentSubject: (subject: Subject | null) => {
        set((state) => {
          state.currentSubject = subject;
          state.error = null;
        });
      },

      setSubjects: (subjects: Subject[]) => {
        set((state) => {
          state.subjects = subjects;
          state.error = null;
        });
      },

      addSubject: (subject: Subject) => {
        set((state) => {
          state.subjects.unshift(subject); // Add to beginning of array
          state.error = null;
        });
      },

      updateSubjectInStore: (id: string, updates: Partial<Subject>) => {
        set((state) => {
          // Update in subjects array
          const subjectIndex = state.subjects.findIndex(
            (s: Subject) => s.id === id
          );
          if (subjectIndex !== -1) {
            state.subjects[subjectIndex] = {
              ...state.subjects[subjectIndex],
              ...updates,
              updatedAt: new Date(),
            };
          }

          // Update current subject if it's the same one
          if (state.currentSubject?.id === id) {
            state.currentSubject = {
              ...state.currentSubject,
              ...updates,
              updatedAt: new Date(),
            };
          }

          state.error = null;
        });
      },

      removeSubject: (id: string) => {
        set((state) => {
          // Remove from subjects array
          state.subjects = state.subjects.filter((s: Subject) => s.id !== id);

          // Clear current subject if it's the one being removed
          if (state.currentSubject?.id === id) {
            state.currentSubject = null;
          }

          state.error = null;
        });
      },

      // Loading state actions
      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setCreating: (creating: boolean) => {
        set((state) => {
          state.isCreating = creating;
        });
      },

      setUpdating: (updating: boolean) => {
        set((state) => {
          state.isUpdating = updating;
        });
      },

      setDeleting: (deleting: boolean) => {
        set((state) => {
          state.isDeleting = deleting;
        });
      },

      // Error handling actions
      setError: (error: string | null) => {
        set((state) => {
          state.error = error;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // Utility actions
      clearSubject: () => {
        set((state) => {
          state.currentSubject = null;
          state.error = null;
        });
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },

      hydrate: () => {
        // This will be called automatically by the persist middleware
        // but can be called manually if needed
      },
    })),
    {
      name: "notebrix-subject-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist certain parts of the state
      partialize: (state) => ({
        currentSubject: state.currentSubject,
        subjects: state.subjects,
      }),
    }
  )
);

// Selector hooks for better performance
export const useCurrentSubject = () =>
  useSubjectStore((state) => state.currentSubject);
export const useSubjects = () => useSubjectStore((state) => state.subjects);
export const useSubjectLoading = () =>
  useSubjectStore((state) => state.isLoading);
export const useSubjectError = () => useSubjectStore((state) => state.error);
