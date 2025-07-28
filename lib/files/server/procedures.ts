import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { files, fileChunks, subjects } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  extractFileSchema,
  fileDeleteSchema,
  getFilesSchema,
  getFileByIdSchema,
  type ExtractedFileResult,
} from "../validation/schemas";
import { FileTextExtractor } from "../utils/fileExtractor";
import { SmartChunkingService } from "../utils/chunkingService";
import { generateEmbedding } from "@/lib/utils/embedding";

// Helper function to convert base64 to File object
function base64ToFile(
  base64Data: string,
  fileName: string,
  fileType: string
): File {
  // Remove data URL prefix if present
  const base64 = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;

  // Convert base64 to binary
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: fileType });
}

export const filesRouter = createTRPCRouter({
  // Upload and process file
  upload: protectedProcedure
    .input(extractFileSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { fileName, fileType, fileSize, fileData, subjectId } = input;

      if (!subjectId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subject ID is required for file upload",
        });
      }

      try {
        // Verify subject exists and belongs to user
        const subject = await db
          .select()
          .from(subjects)
          .where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id)));

        if (!subject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subject not found or access denied",
          });
        }

        // Convert base64 to File object for processing
        const file = base64ToFile(fileData, fileName, fileType);

        // Extract text content from file
        let extractedData: ExtractedFileResult;
        try {
          extractedData = await FileTextExtractor.extractFromFile(file);
        } catch (extractionError) {
          console.error("File extraction failed:", extractionError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to extract content from file: ${
              extractionError instanceof Error
                ? extractionError.message
                : "Unknown error"
            }`,
          });
        }

        // Chunk the extracted text
        const chunks = SmartChunkingService.chunkText(
          extractedData.extractedText,
          {
            maxTokens: 1000,
            minTokens: 150,
            overlapTokens: 75,
            preserveParagraphs: true,
          }
        );

        if (chunks.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No content could be extracted from the file",
          });
        }

        // Generate embeddings for all chunks
        const chunksWithEmbeddings = [];
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          try {
            const embedding = await generateEmbedding(chunk.content);
            chunksWithEmbeddings.push({
              ...chunk,
              embedding,
            });
          } catch (embeddingError) {
            console.error(
              `Failed to generate embedding for chunk ${i}:`,
              embeddingError
            );
            // Continue without embedding for this chunk
            chunksWithEmbeddings.push({
              ...chunk,
              embedding: null,
            });
          }
        }

        // Get chunking statistics
        const chunkingStats = SmartChunkingService.getChunkingStats(chunks);

        // Create file record (without transaction for Neon HTTP driver compatibility)
        const [fileRecord] = await db
          .insert(files)
          .values({
            userId: user.id,
            subjectId,
            fileName,
            fileType,
            fileSize,
            status: "completed",
            totalChunks: chunkingStats.totalChunks,
            totalTokens: chunkingStats.totalTokens,
            wordCount: extractedData.wordCount,
            pageCount: extractedData.pageCount || null,
          })
          .returning();

        if (!fileRecord) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create file record",
          });
        }

        // Insert chunks with embeddings
        if (chunksWithEmbeddings.length > 0) {
          const chunksToInsert = chunksWithEmbeddings.map((chunk) => ({
            fileId: fileRecord.id,
            content: chunk.content,
            tokenCount: chunk.tokenCount,
            chunkIndex: chunk.chunkIndex,
            startPosition: chunk.startPosition,
            endPosition: chunk.endPosition,
            embedding: chunk.embedding,
            sourceMetadata: {
              fileName: fileName,
              fileType: fileType,
              extractedAt: new Date().toISOString(),
            },
          }));

          try {
            // Insert chunks in batches to avoid potential size limits
            const batchSize = 50;
            for (let i = 0; i < chunksToInsert.length; i += batchSize) {
              const batch = chunksToInsert.slice(i, i + batchSize);
              await db.insert(fileChunks).values(batch);
            }
          } catch (chunkError) {
            // If chunks fail to insert, try to clean up the file record
            console.error(
              "Failed to insert chunks, cleaning up file record:",
              chunkError
            );
            try {
              await db.delete(files).where(eq(files.id, fileRecord.id));
            } catch (cleanupError) {
              console.error("Failed to cleanup file record:", cleanupError);
            }
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to store file chunks",
            });
          }
        }

        return {
          success: true,
          file: {
            id: fileRecord.id,
            fileName: fileRecord.fileName,
            fileType: fileRecord.fileType,
            fileSize: fileRecord.fileSize,
            totalChunks: fileRecord.totalChunks,
            totalTokens: fileRecord.totalTokens,
            wordCount: fileRecord.wordCount,
            pageCount: fileRecord.pageCount,
            createdAt: fileRecord.createdAt,
          },
          processing: {
            chunksGenerated: chunkingStats.totalChunks,
            tokensProcessed: chunkingStats.totalTokens,
            embeddingsGenerated: chunksWithEmbeddings.filter(
              (c) => c.embedding !== null
            ).length,
            averageTokensPerChunk: chunkingStats.averageTokensPerChunk,
          },
        };
      } catch (error) {
        console.error("File upload error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process file upload",
        });
      }
    }),

  // Get files by subject
  getBySubject: protectedProcedure
    .input(getFilesSchema)
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { subjectId } = input;

      // Verify subject belongs to user
      const subject = await db
        .select()
        .from(subjects)
        .where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id)));

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found or access denied",
        });
      }

      const userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.subjectId, subjectId), eq(files.userId, user.id)))
        .orderBy(desc(files.createdAt));

      return userFiles;
    }),

  // Get file by ID with chunks
  getById: protectedProcedure
    .input(getFileByIdSchema)
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { fileId } = input;

      const file = await db
        .select({
          file: files,
          chunk: fileChunks,
        })
        .from(files)
        .leftJoin(fileChunks, eq(fileChunks.fileId, files.id))
        .where(and(eq(files.id, fileId), eq(files.userId, user.id)))
        .orderBy(desc(fileChunks.chunkIndex));

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found or access denied",
        });
      }

      return file;
    }),

  // Delete file and all its chunks
  delete: protectedProcedure
    .input(fileDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { fileId } = input;

      // Verify file belongs to user
      const file = await db
        .select()
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.userId, user.id)));

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found or access denied",
        });
      }

      try {
        // Delete chunks first (foreign key constraint)
        await db.delete(fileChunks).where(eq(fileChunks.fileId, fileId));

        // Delete file record
        await db.delete(files).where(eq(files.id, fileId));

        return {
          success: true,
          message: "File and all associated chunks deleted successfully",
        };
      } catch (error) {
        console.error("File deletion error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete file",
        });
      }
    }),

  // Get file statistics for a subject
  getStats: protectedProcedure
    .input(getFilesSchema)
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { subjectId } = input;

      // Verify subject belongs to user
      const subject = await db
        .select()
        .from(subjects)
        .where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id)));

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found or access denied",
        });
      }

      const subjectFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.subjectId, subjectId), eq(files.userId, user.id)));

      // Calculate statistics
      const totalFiles = subjectFiles.length;
      const completedFiles = subjectFiles.filter(
        (f) => f.status === "completed"
      ).length;
      const failedFiles = subjectFiles.filter(
        (f) => f.status === "failed"
      ).length;
      const totalChunks = subjectFiles.reduce(
        (sum, f) => sum + (f.totalChunks || 0),
        0
      );
      const totalTokens = subjectFiles.reduce(
        (sum, f) => sum + (f.totalTokens || 0),
        0
      );
      const totalSize = subjectFiles.reduce((sum, f) => sum + f.fileSize, 0);
      const totalWords = subjectFiles.reduce(
        (sum, f) => sum + (f.wordCount || 0),
        0
      );

      // Group by file type
      const fileTypes: Record<string, number> = {};
      subjectFiles.forEach((file) => {
        fileTypes[file.fileType] = (fileTypes[file.fileType] || 0) + 1;
      });

      return {
        totalFiles,
        completedFiles,
        failedFiles,
        totalChunks,
        totalTokens,
        totalWords,
        totalSize,
        fileTypes,
      };
    }),
});
