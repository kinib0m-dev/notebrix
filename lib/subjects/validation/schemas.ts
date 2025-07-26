import { z } from "zod";
import { SUBJECT_COLORS, SubjectColor } from "../types";

// User evaluation enum
export const userEvaluationSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

// Subject color validation
export const subjectColorSchema = z
  .string()
  .refine(
    (color): color is SubjectColor | `#${string}` =>
      (SUBJECT_COLORS as readonly string[]).includes(color) ||
      /^#[0-9A-F]{6}$/i.test(color),
    {
      message:
        "Color must be a valid hex color or one of the predefined colors",
    }
  );

// Create subject validation schema
export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(1, "Subject name is required")
    .max(100, "Subject name must be less than 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  userEvaluation: userEvaluationSchema.default("beginner"),
  color: subjectColorSchema.default("#3B82F6"),
});

// Update subject validation schema
export const updateSubjectSchema = z.object({
  id: z.string().uuid("Invalid subject ID"),
  name: z
    .string()
    .min(1, "Subject name is required")
    .max(100, "Subject name must be less than 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  userEvaluation: userEvaluationSchema.optional(),
  color: subjectColorSchema.optional(),
});

// Get subject by ID schema
export const getSubjectByIdSchema = z.object({
  id: z.string().uuid("Invalid subject ID"),
});

// Archive subject schema
export const archiveSubjectSchema = z.object({
  id: z.string().uuid("Invalid subject ID"),
});

// Delete subject schema
export const deleteSubjectSchema = z.object({
  id: z.string().uuid("Invalid subject ID"),
});

// Export inferred types
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type GetSubjectByIdInput = z.infer<typeof getSubjectByIdSchema>;
export type ArchiveSubjectInput = z.infer<typeof archiveSubjectSchema>;
export type DeleteSubjectInput = z.infer<typeof deleteSubjectSchema>;
