// File status types
export type FileStatus = "completed" | "failed";

// Chunk types
export type ChunkType = "text" | "image" | "table" | "diagram";

// Processing stages
export type ProcessingStage = 
  | "preparing"
  | "extracting" 
  | "chunking" 
  | "processing_images" 
  | "storing" 
  | "completed" 
  | "failed";

// File interfaces
export interface FileRecord {
  id: string;
  userId: string;
  subjectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: FileStatus;
  processingError?: string | null;
  totalChunks?: number | null;
  totalTokens?: number | null;
  wordCount?: number | null;
  pageCount?: number | null;
  hasImages?: boolean | null;
  imageCount?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// File chunk interface
export interface FileChunk {
  id: string;
  fileId: string;
  content: string;
  tokenCount: number;
  chunkIndex: number;
  startPosition?: number | null;
  endPosition?: number | null;
  chunkType: ChunkType;
  sourceMetadata?: Record<string, unknown> | null;
  embedding?: number[] | null;
  semanticHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// File with chunks
export interface FileWithChunks extends FileRecord {
  chunks: FileChunk[];
}

// File upload progress
export interface FileUploadProgress {
  fileName: string;
  progress: number;
  stage: ProcessingStage;
  message?: string;
  error?: string;
}

// File statistics
export interface FileStatistics {
  totalFiles: number;
  totalChunks: number;
  totalTokens: number;
  totalWords: number;
  totalSize: number;
  filesWithImages: number;
  totalImages: number;
  fileTypes: Record<string, number>;
  completedFiles: number;
  failedFiles: number;
}

// File upload result
export interface FileUploadResult {
  success: boolean;
  file: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    totalChunks?: number | null;
    totalTokens?: number | null;
    wordCount?: number | null;
    hasImages?: boolean | null;
    imageCount?: number | null;
    createdAt: Date;
  };
  processing: {
    progress: number;
    stage: ProcessingStage;
    message: string;
  };
}

// Supported file types
export const SUPPORTED_FILE_TYPES = [
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

export type SupportedFileType = typeof SUPPORTED_FILE_TYPES[number];

// File type display names
export const FILE_TYPE_NAMES: Record<SupportedFileType, string> = {
  "application/pdf": "PDF Document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
  "application/msword": "Word Document (Legacy)",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint Presentation", 
  "application/vnd.ms-powerpoint": "PowerPoint Presentation (Legacy)",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel Spreadsheet",
  "application/vnd.ms-excel": "Excel Spreadsheet (Legacy)",
  "text/csv": "CSV File",
  "text/plain": "Text File",
  "text/markdown": "Markdown File",
  "application/rtf": "Rich Text Format"
};

// File type icons
export const FILE_TYPE_ICONS: Record<SupportedFileType, string> = {
  "application/pdf": "📄",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "📊",
  "application/vnd.ms-powerpoint": "📊", 
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📈",
  "application/vnd.ms-excel": "📈",
  "text/csv": "📋",
  "text/plain": "📃",
  "text/markdown": "📃",
  "application/rtf": "📃"
};

// Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 5;
export const CHUNK_MAX_TOKENS = 1000;