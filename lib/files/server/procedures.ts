import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { files, fileChunks, subjects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { 
  fileUploadSchema, 
  fileDeleteSchema, 
  getFilesSchema, 
  getFileByIdSchema,
  validateFileExtension
} from "../validation/schemas";
import { FileTextExtractor } from "../utils/fileExtractor";
import { ChunkDatabaseService } from "../utils/chunkDatabase";

export const filesRouter = createTRPCRouter({
  // Upload and process file
  upload: protectedProcedure
    .input(fileUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { subjectId, fileName, fileType, fileSize, fileContent } = input;

      try {
        // Validate file extension matches MIME type
        if (!validateFileExtension(fileName, fileType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File extension does not match file type"
          });
        }

        // Check if subject exists and belongs to user
        const subject = await db.query.subjects.findFirst({
          where: and(
            eq(subjects.id, subjectId),
            eq(subjects.userId, user.id),
            eq(subjects.isArchived, false)
          )
        });

        if (!subject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subject not found or access denied"
          });
        }

        // Convert base64 to File object for processing
        const base64Data = fileContent.includes(',') ? fileContent.split(',')[1] : fileContent;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const file = new File([bytes], fileName, { type: fileType });

        // Extract content and process file
        const extractedResult = await FileTextExtractor.extractFromFile(file);

        // Prepare data for database storage
        const fileProcessingResult = ChunkDatabaseService.prepareForDatabase({
          ...extractedResult,
          fileSize,
          fileType
        });

        // Validate chunks before storing
        const validation = ChunkDatabaseService.validateChunks(fileProcessingResult.chunks);
        if (!validation.valid) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Invalid chunks generated: ${validation.errors.join(', ')}`
          });
        }

        // Use database transaction if available
        const result = await db.transaction(async (tx) => {
          // Create file record
          const [fileRecord] = await tx.insert(files).values({
            userId: user.id,
            subjectId,
            fileName,
            fileType,
            fileSize,
            status: "completed",
            totalChunks: fileProcessingResult.totalChunks,
            totalTokens: fileProcessingResult.totalTokens,
            wordCount: fileProcessingResult.wordCount,
            pageCount: fileProcessingResult.pageCount,
            hasImages: fileProcessingResult.hasImages,
            imageCount: fileProcessingResult.imageCount
          }).returning();

          if (!fileRecord) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create file record"
            });
          }

          // Insert chunks
          if (fileProcessingResult.chunks.length > 0) {
            const chunksToInsert = fileProcessingResult.chunks.map(chunk => ({
              fileId: fileRecord.id,
              content: chunk.content,
              tokenCount: chunk.tokenCount,
              chunkIndex: chunk.chunkIndex,
              startPosition: chunk.startPosition,
              endPosition: chunk.endPosition,
              chunkType: chunk.chunkType,
              sourceMetadata: chunk.sourceMetadata || {}
            }));

            await tx.insert(fileChunks).values(chunksToInsert);
          }

          return fileRecord;
        });

        return {
          success: true,
          file: {
            id: result.id,
            fileName: result.fileName,
            fileType: result.fileType,
            fileSize: result.fileSize,
            totalChunks: result.totalChunks,
            totalTokens: result.totalTokens,
            wordCount: result.wordCount,
            hasImages: result.hasImages,
            imageCount: result.imageCount,
            createdAt: result.createdAt
          },
          processing: {
            progress: 100,
            stage: "completed" as const,
            message: "File processed successfully"
          }
        };

      } catch (error) {
        console.error("File upload error:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to process file"
        });
      }
    }),

  // Get all files for a subject
  getBySubject: protectedProcedure
    .input(getFilesSchema)
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { subjectId } = input;

      // Verify subject ownership
      const subject = await db.query.subjects.findFirst({
        where: and(
          eq(subjects.id, subjectId),
          eq(subjects.userId, user.id)
        )
      });

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found or access denied"
        });
      }

      // Get files for the subject
      const subjectFiles = await db.query.files.findMany({
        where: and(
          eq(files.subjectId, subjectId),
          eq(files.userId, user.id)
        ),
        orderBy: (files, { desc }) => [desc(files.createdAt)]
      });

      return subjectFiles.map(file => ({
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        status: file.status,
        totalChunks: file.totalChunks,
        totalTokens: file.totalTokens,
        wordCount: file.wordCount,
        pageCount: file.pageCount,
        hasImages: file.hasImages,
        imageCount: file.imageCount,
        processingError: file.processingError,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }));
    }),

  // Get file by ID
  getById: protectedProcedure
    .input(getFileByIdSchema)
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { fileId } = input;

      const file = await db.query.files.findFirst({
        where: and(
          eq(files.id, fileId),
          eq(files.userId, user.id)
        ),
        with: {
          chunks: {
            orderBy: (chunks, { asc }) => [asc(chunks.chunkIndex)]
          }
        }
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found or access denied"
        });
      }

      return {
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        status: file.status,
        totalChunks: file.totalChunks,
        totalTokens: file.totalTokens,
        wordCount: file.wordCount,
        pageCount: file.pageCount,
        hasImages: file.hasImages,
        imageCount: file.imageCount,
        processingError: file.processingError,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        chunks: file.chunks?.map(chunk => ({
          id: chunk.id,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          chunkIndex: chunk.chunkIndex,
          chunkType: chunk.chunkType,
          sourceMetadata: chunk.sourceMetadata
        })) || []
      };
    }),

  // Delete file
  delete: protectedProcedure
    .input(fileDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { fileId } = input;

      // Check if file exists and belongs to user
      const file = await db.query.files.findFirst({
        where: and(
          eq(files.id, fileId),
          eq(files.userId, user.id)
        )
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found or access denied"
        });
      }

      // Delete file (chunks will be deleted by cascade)
      await db.delete(files).where(
        and(
          eq(files.id, fileId),
          eq(files.userId, user.id)
        )
      );

      return {
        success: true,
        message: "File deleted successfully"
      };
    }),

  // Get file statistics for a subject
  getStats: protectedProcedure
    .input(getFilesSchema)
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { subjectId } = input;

      // Verify subject ownership
      const subject = await db.query.subjects.findFirst({
        where: and(
          eq(subjects.id, subjectId),
          eq(subjects.userId, user.id)
        )
      });

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found or access denied"
        });
      }

      const subjectFiles = await db.query.files.findMany({
        where: and(
          eq(files.subjectId, subjectId),
          eq(files.userId, user.id)
        )
      });

      const stats = {
        totalFiles: subjectFiles.length,
        totalChunks: subjectFiles.reduce((sum, file) => sum + (file.totalChunks || 0), 0),
        totalTokens: subjectFiles.reduce((sum, file) => sum + (file.totalTokens || 0), 0),
        totalWords: subjectFiles.reduce((sum, file) => sum + (file.wordCount || 0), 0),
        totalSize: subjectFiles.reduce((sum, file) => sum + file.fileSize, 0),
        filesWithImages: subjectFiles.filter(file => file.hasImages).length,
        totalImages: subjectFiles.reduce((sum, file) => sum + (file.imageCount || 0), 0),
        fileTypes: subjectFiles.reduce((acc, file) => {
          acc[file.fileType] = (acc[file.fileType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        completedFiles: subjectFiles.filter(file => file.status === "completed").length,
        failedFiles: subjectFiles.filter(file => file.status === "failed").length
      };

      return stats;
    })
});