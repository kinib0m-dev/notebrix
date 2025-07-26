// User evaluation levels
export type UserEvaluation = "beginner" | "intermediate" | "advanced";

// Subject interface based on database schema
export interface Subject {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  userEvaluation: UserEvaluation;
  color: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create subject input type
export interface CreateSubjectInput {
  name: string;
  description?: string;
  userEvaluation?: UserEvaluation;
  color?: string;
}

// Update subject input type
export interface UpdateSubjectInput {
  id: string;
  name?: string;
  description?: string;
  userEvaluation?: UserEvaluation;
  color?: string;
}

// Subject store state interface
export interface SubjectStoreState {
  // Current subject state
  currentSubject: Subject | null;

  // All user subjects
  subjects: Subject[];

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error state
  error: string | null;
}

// Subject store actions interface
export interface SubjectStoreActions {
  // Subject management
  setCurrentSubject: (subject: Subject | null) => void;
  setSubjects: (subjects: Subject[]) => void;
  addSubject: (subject: Subject) => void;
  updateSubjectInStore: (id: string, updates: Partial<Subject>) => void;
  removeSubject: (id: string) => void;

  // Loading states
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Persistence and reset
  clearSubject: () => void;
  reset: () => void;
  hydrate: () => void;
}

// Combined store type
export type SubjectStore = SubjectStoreState & SubjectStoreActions;

// Predefined color options for subjects
export const SUBJECT_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
] as const;

export type SubjectColor = (typeof SUBJECT_COLORS)[number];
