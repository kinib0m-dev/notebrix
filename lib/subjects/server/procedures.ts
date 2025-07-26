import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import {
  createSubjectSchema,
  updateSubjectSchema,
  getSubjectByIdSchema,
  archiveSubjectSchema,
  deleteSubjectSchema,
} from "../validation/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const subjectsRouter = createTRPCRouter({
  // Create a new subject
  create: protectedProcedure
    .input(createSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [newSubject] = await db
          .insert(subjects)
          .values({
            userId: ctx.userId as string,
            name: input.name,
            description: input.description || null,
            userEvaluation: input.userEvaluation,
            color: input.color,
          })
          .returning();

        if (!newSubject) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create subject",
          });
        }

        return {
          success: true,
          data: newSubject,
          message: "Subject created successfully",
        };
      } catch (error) {
        console.error("Error creating subject:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create subject",
        });
      }
    }),

  // Get all subjects for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userSubjects = await db
        .select()
        .from(subjects)
        .where(
          and(
            eq(subjects.userId, ctx.userId as string),
            eq(subjects.isArchived, false)
          )
        )
        .orderBy(desc(subjects.createdAt));

      return {
        success: true,
        data: userSubjects,
      };
    } catch (error) {
      console.error("Error fetching subjects:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subjects",
      });
    }
  }),

  // Get archived subjects for the current user
  getArchived: protectedProcedure.query(async ({ ctx }) => {
    try {
      const archivedSubjects = await db
        .select()
        .from(subjects)
        .where(
          and(
            eq(subjects.userId, ctx.userId as string),
            eq(subjects.isArchived, true)
          )
        )
        .orderBy(desc(subjects.updatedAt));

      return {
        success: true,
        data: archivedSubjects,
      };
    } catch (error) {
      console.error("Error fetching archived subjects:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch archived subjects",
      });
    }
  }),

  // Get subject by ID
  getById: protectedProcedure
    .input(getSubjectByIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        const [subject] = await db
          .select()
          .from(subjects)
          .where(
            and(
              eq(subjects.id, input.id),
              eq(subjects.userId, ctx.userId as string)
            )
          );

        if (!subject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subject not found",
          });
        }

        return {
          success: true,
          data: subject,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error fetching subject:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subject",
        });
      }
    }),

  // Update subject
  update: protectedProcedure
    .input(updateSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        // First check if subject exists and belongs to user
        const [existingSubject] = await db
          .select()
          .from(subjects)
          .where(
            and(eq(subjects.id, id), eq(subjects.userId, ctx.userId as string))
          );

        if (!existingSubject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subject not found",
          });
        }

        // Update the subject
        const [updatedSubject] = await db
          .update(subjects)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(subjects.id, id))
          .returning();

        if (!updatedSubject) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update subject",
          });
        }

        return {
          success: true,
          data: updatedSubject,
          message: "Subject updated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error updating subject:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update subject",
        });
      }
    }),

  // Archive subject (soft delete)
  archive: protectedProcedure
    .input(archiveSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // First check if subject exists and belongs to user
        const [existingSubject] = await db
          .select()
          .from(subjects)
          .where(
            and(
              eq(subjects.id, input.id),
              eq(subjects.userId, ctx.userId as string)
            )
          );

        if (!existingSubject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subject not found",
          });
        }

        if (existingSubject.isArchived) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Subject is already archived",
          });
        }

        // Archive the subject
        const [archivedSubject] = await db
          .update(subjects)
          .set({
            isArchived: true,
            updatedAt: new Date(),
          })
          .where(eq(subjects.id, input.id))
          .returning();

        if (!archivedSubject) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to archive subject",
          });
        }

        return {
          success: true,
          data: archivedSubject,
          message: "Subject archived successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error archiving subject:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to archive subject",
        });
      }
    }),

  // Delete subject permanently
  delete: protectedProcedure
    .input(deleteSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // First check if subject exists and belongs to user
        const [existingSubject] = await db
          .select()
          .from(subjects)
          .where(
            and(
              eq(subjects.id, input.id),
              eq(subjects.userId, ctx.userId as string)
            )
          );

        if (!existingSubject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subject not found",
          });
        }

        // Delete the subject
        await db.delete(subjects).where(eq(subjects.id, input.id));

        return {
          success: true,
          message: "Subject deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error deleting subject:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete subject",
        });
      }
    }),
});
