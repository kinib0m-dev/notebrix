import { z } from "zod";

// Supported file types
const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "text/markdown",
  "application/rtf"
] as const;

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// File upload schema
export const fileUploadSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID format"),
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name too long")
    .refine((name) => name.trim().length > 0, "File name cannot be empty"),
  fileType: z
    .string()
    .refine(
      (type): type is typeof SUPPORTED_FILE_TYPES[number] =>
        SUPPORTED_FILE_TYPES.includes(type as typeof SUPPORTED_FILE_TYPES[number]),
      "Unsupported file type"
    ),
  fileSize: z
    .number()
    .int("File size must be an integer")
    .min(1, "File cannot be empty")
    .max(MAX_FILE_SIZE, `File size cannot exceed ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`),
  fileContent: z
    .string()
    .min(1, "File content is required")
    .refine(
      (content) => {
        try {
          // Validate base64 content
          const base64Data = content.includes(',') ? content.split(',')[1] : content;
          atob(base64Data);
          return true;
        } catch {
          return false;
        }
      },
      "Invalid file content format"
    )
});

// File delete schema
export const fileDeleteSchema = z.object({
  fileId: z.string().uuid("Invalid file ID format")
});

// Get files schema
export const getFilesSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID format")
});

// Get file by ID schema
export const getFileByIdSchema = z.object({
  fileId: z.string().uuid("Invalid file ID format")
});

// File processing progress schema
export const fileProcessingProgressSchema = z.object({
  fileId: z.string().uuid("Invalid file ID format"),
  progress: z.number().min(0).max(100),
  stage: z.enum([
    "extracting",
    "chunking", 
    "processing_images",
    "storing",
    "completed",
    "failed"
  ]),
  message: z.string().optional(),
  error: z.string().optional()
});

// Inferred types
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type FileDeleteInput = z.infer<typeof fileDeleteSchema>;
export type GetFilesInput = z.infer<typeof getFilesSchema>;
export type GetFileByIdInput = z.infer<typeof getFileByIdSchema>;
export type FileProcessingProgress = z.infer<typeof fileProcessingProgressSchema>;

// Constants export
export { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE };

// Utility function to validate file extension matches MIME type
export const validateFileExtension = (fileName: string, mimeType: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeToExtensions: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "application/msword": ["doc"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
    "application/vnd.ms-powerpoint": ["ppt"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
    "application/vnd.ms-excel": ["xls"],
    "text/csv": ["csv"],
    "text/plain": ["txt"],
    "text/markdown": ["md", "markdown"],
    "application/rtf": ["rtf"]
  };

  const validExtensions = mimeToExtensions[mimeType];
  return validExtensions ? validExtensions.includes(extension || "") : false;
};

// File status enum for database
export const fileStatusEnum = z.enum(["completed", "failed"]);
export type FileStatus = z.infer<typeof fileStatusEnum>;