import type { Subject, UserEvaluation, SubjectColor } from "../types";
import { SUBJECT_COLORS } from "../types";

/**
 * Get a random color from the predefined subject colors
 */
export function getRandomSubjectColor(): SubjectColor {
  const randomIndex = Math.floor(Math.random() * SUBJECT_COLORS.length);
  return SUBJECT_COLORS[randomIndex];
}

/**
 * Get the display name for user evaluation levels
 */
export function getUserEvaluationDisplayName(
  evaluation: UserEvaluation
): string {
  const displayNames: Record<UserEvaluation, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };
  return displayNames[evaluation];
}

/**
 * Get the description for user evaluation levels
 */
export function getUserEvaluationDescription(
  evaluation: UserEvaluation
): string {
  const descriptions: Record<UserEvaluation, string> = {
    beginner: "I'm new to this subject and need detailed explanations",
    intermediate: "I have some knowledge and want balanced content",
    advanced: "I'm experienced and prefer concise, technical content",
  };
  return descriptions[evaluation];
}

/**
 * Get emoji for user evaluation levels
 */
export function getUserEvaluationEmoji(evaluation: UserEvaluation): string {
  const emojis: Record<UserEvaluation, string> = {
    beginner: "🌱",
    intermediate: "📚",
    advanced: "🎓",
  };
  return emojis[evaluation];
}

/**
 * Sort subjects by creation date (newest first)
 */
export function sortSubjectsByDate(subjects: Subject[]): Subject[] {
  return [...subjects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Sort subjects by name alphabetically
 */
export function sortSubjectsByName(subjects: Subject[]): Subject[] {
  return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter subjects by search term
 */
export function filterSubjectsBySearch(
  subjects: Subject[],
  searchTerm: string
): Subject[] {
  if (!searchTerm.trim()) return subjects;

  const lowercaseSearch = searchTerm.toLowerCase().trim();

  return subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(lowercaseSearch) ||
      (subject.description &&
        subject.description.toLowerCase().includes(lowercaseSearch))
  );
}

/**
 * Get initials from subject name for avatar fallback
 */
export function getSubjectInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Validate hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Get contrast color (black or white) for a given background color
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

/**
 * Format subject creation date for display
 */
export function formatSubjectDate(date: Date): string {
  // Ensure we have a valid Date object
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("formatSubjectDate received invalid date:", date);
    return "Invalid date";
  }

  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Generate a unique subject name if one already exists
 */
export function generateUniqueSubjectName(
  baseName: string,
  existingSubjects: Subject[]
): string {
  const existingNames = existingSubjects.map((s) => s.name.toLowerCase());

  if (!existingNames.includes(baseName.toLowerCase())) {
    return baseName;
  }

  let counter = 1;
  let newName = `${baseName} (${counter})`;

  while (existingNames.includes(newName.toLowerCase())) {
    counter++;
    newName = `${baseName} (${counter})`;
  }

  return newName;
}

/**
 * Check if subject name is valid (not empty, within length limits)
 */
export function isValidSubjectName(name: string): boolean {
  const trimmedName = name.trim();
  return trimmedName.length > 0 && trimmedName.length <= 100;
}

/**
 * Check if subject description is valid (within length limits)
 */
export function isValidSubjectDescription(description?: string): boolean {
  if (!description) return true; // Description is optional
  return description.trim().length <= 500;
}

/**
 * Get subject color with opacity
 */
export function getSubjectColorWithOpacity(
  color: string,
  opacity: number
): string {
  // Convert hex to RGB
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
