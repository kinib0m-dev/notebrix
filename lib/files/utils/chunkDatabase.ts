import { TextChunk } from './chunkingService';
import { ProcessedImage } from './imageExtractor';

export interface DatabaseChunk {
  content: string;
  tokenCount: number;
  chunkIndex: number;
  startPosition?: number;
  endPosition?: number;
  chunkType: 'text' | 'image' | 'table' | 'diagram';
  sourceMetadata?: Record<string, unknown>;
}

export interface FileProcessingResult {
  fileName: string;
  fileType: string;
  fileSize: number;
  totalChunks: number;
  totalTokens: number;
  wordCount: number;
  pageCount?: number;
  hasImages: boolean;
  imageCount: number;
  chunks: DatabaseChunk[];
  processingMetadata: Record<string, unknown>;
}

export class ChunkDatabaseService {
  /**
   * Converts TextChunk objects to database-compatible format
   */
  static convertChunksToDatabase(chunks: TextChunk[]): DatabaseChunk[] {
    return chunks.map(chunk => ({
      content: chunk.content,
      tokenCount: chunk.metadata.tokenCount,
      chunkIndex: chunk.metadata.chunkIndex,
      startPosition: chunk.metadata.startPosition,
      endPosition: chunk.metadata.endPosition,
      chunkType: chunk.metadata.sourceType,
      sourceMetadata: {
        paragraphIndex: chunk.metadata.paragraphIndex,
        pageNumber: chunk.metadata.pageNumber,
        hasImages: chunk.metadata.hasImages,
        imageDescriptions: chunk.metadata.imageDescriptions,
        extractedAt: new Date().toISOString()
      }
    }));
  }

  /**
   * Creates database chunks specifically for image descriptions
   */
  static createImageChunks(
    processedImages: ProcessedImage[],
    startingChunkIndex: number = 0
  ): DatabaseChunk[] {
    return processedImages
      .filter(img => img.description.trim())
      .map((img, index) => ({
        content: `[Image Description: ${img.description}]`,
        tokenCount: Math.ceil(img.description.split(/\s+/).length * 1.33),
        chunkIndex: startingChunkIndex + index,
        chunkType: 'image' as const,
        sourceMetadata: {
          pageNumber: img.pageNumber,
          position: img.position,
          confidence: img.confidence,
          model: img.model,
          processingTime: img.processingTime,
          extractedAt: new Date().toISOString()
        }
      }));
  }

  /**
   * Merges text chunks and image chunks, maintaining proper ordering
   */
  static mergeTextAndImageChunks(
    textChunks: TextChunk[],
    processedImages: ProcessedImage[]
  ): DatabaseChunk[] {
    const databaseTextChunks = this.convertChunksToDatabase(textChunks);
    const imageChunks = this.createImageChunks(processedImages, textChunks.length);
    
    // Combine and sort by position if available, otherwise by chunk index
    const allChunks = [...databaseTextChunks, ...imageChunks];
    
    allChunks.sort((a, b) => {
      // First try to sort by start position
      if (a.startPosition !== undefined && b.startPosition !== undefined) {
        return a.startPosition - b.startPosition;
      }
      
      // Fallback to chunk index
      return a.chunkIndex - b.chunkIndex;
    });

    // Re-index chunks after sorting
    allChunks.forEach((chunk, index) => {
      chunk.chunkIndex = index;
    });

    return allChunks;
  }

  /**
   * Converts ExtractedFileResult to FileProcessingResult for database storage
   */
  static prepareForDatabase(extractedResult: {
    fileName: string;
    fileType: string;
    fileSize: number;
    extractedText?: string;
    wordCount?: number;
    pageCount?: number;
    chunks?: TextChunk[];
    processedImages?: ProcessedImage[];
    totalTokens?: number;
    metadata?: Record<string, unknown>;
  }): FileProcessingResult {
    const {
      fileName,
      fileType,
      fileSize,
      wordCount = 0,
      pageCount,
      chunks = [],
      processedImages = [],
      totalTokens = 0,
      metadata = {}
    } = extractedResult;

    // Convert chunks to database format
    const databaseChunks = chunks.length > 0 
      ? this.mergeTextAndImageChunks(chunks, processedImages)
      : this.createImageChunks(processedImages);

    const totalChunks = databaseChunks.length;
    const calculatedTotalTokens = databaseChunks.reduce(
      (sum, chunk) => sum + chunk.tokenCount, 
      0
    );

    return {
      fileName,
      fileType,
      fileSize,
      totalChunks,
      totalTokens: calculatedTotalTokens || totalTokens,
      wordCount,
      pageCount,
      hasImages: processedImages.length > 0,
      imageCount: processedImages.length,
      chunks: databaseChunks,
      processingMetadata: {
        ...metadata,
        processedAt: new Date().toISOString(),
        chunkingStrategy: 'paragraph-based',
        maxTokensPerChunk: 1000,
        preserveSentences: true,
        imageProcessingEnabled: true
      }
    };
  }

  /**
   * Validates chunk data before database insertion
   */
  static validateChunks(chunks: DatabaseChunk[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [index, chunk] of chunks.entries()) {
      if (!chunk.content || chunk.content.trim().length === 0) {
        errors.push(`Chunk ${index} has empty content`);
      }

      if (chunk.tokenCount <= 0) {
        errors.push(`Chunk ${index} has invalid token count: ${chunk.tokenCount}`);
      }

      if (chunk.chunkIndex < 0) {
        errors.push(`Chunk ${index} has invalid chunk index: ${chunk.chunkIndex}`);
      }

      if (!['text', 'image', 'table', 'diagram'].includes(chunk.chunkType)) {
        errors.push(`Chunk ${index} has invalid chunk type: ${chunk.chunkType}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generates statistics about the chunking process
   */
  static generateChunkingStats(chunks: DatabaseChunk[]): Record<string, unknown> {
    const totalChunks = chunks.length;
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
    
    const chunkTypes = chunks.reduce((acc, chunk) => {
      acc[chunk.chunkType] = (acc[chunk.chunkType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tokenCounts = chunks.map(chunk => chunk.tokenCount);
    const avgTokens = totalTokens / totalChunks;
    const minTokens = Math.min(...tokenCounts);
    const maxTokens = Math.max(...tokenCounts);

    const chunksWithImages = chunks.filter(chunk => 
      chunk.sourceMetadata?.hasImages === true
    ).length;

    return {
      totalChunks,
      totalTokens,
      averageTokensPerChunk: Math.round(avgTokens),
      minTokensPerChunk: minTokens,
      maxTokensPerChunk: maxTokens,
      chunkTypeDistribution: chunkTypes,
      chunksWithImages,
      imageChunks: chunkTypes.image || 0,
      textChunks: chunkTypes.text || 0,
      tableChunks: chunkTypes.table || 0,
      diagramChunks: chunkTypes.diagram || 0
    };
  }
}