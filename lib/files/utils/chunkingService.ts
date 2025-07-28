/**
 * Smart chunking service for optimal semantic search
 * Features:
 * - Paragraph-based chunking with semantic boundary preservation
 * - Max 1000 tokens per chunk (4 chars ≈ 1 token)
 * - 75-token overlap between chunks for context continuity
 * - Word boundary preservation (never split words)
 * - 150-token minimum chunk size to avoid fragments
 */

export interface ChunkResult {
  content: string;
  tokenCount: number;
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  chunkType: 'text';
}

export interface ChunkingOptions {
  maxTokens?: number;
  minTokens?: number;
  overlapTokens?: number;
  preserveParagraphs?: boolean;
}

export class SmartChunkingService {
  private static readonly DEFAULT_MAX_TOKENS = 1000;
  private static readonly DEFAULT_MIN_TOKENS = 150;
  private static readonly DEFAULT_OVERLAP_TOKENS = 75;
  private static readonly CHARS_PER_TOKEN = 4;

  /**
   * Estimate token count from character count
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Split text into paragraphs using multiple heuristics
   */
  private static splitIntoParagraphs(text: string): string[] {
    // First, split by double newlines (most common paragraph separator)
    let paragraphs = text.split(/\n\s*\n/);
    
    // If we only got one paragraph, try single newlines with length heuristic
    if (paragraphs.length === 1) {
      const lines = text.split('\n');
      const potentialParagraphs: string[] = [];
      let currentParagraph = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Empty line indicates paragraph break
        if (trimmedLine === '') {
          if (currentParagraph.trim()) {
            potentialParagraphs.push(currentParagraph.trim());
            currentParagraph = '';
          }
          continue;
        }
        
        // Add line to current paragraph
        currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
      }
      
      // Add final paragraph
      if (currentParagraph.trim()) {
        potentialParagraphs.push(currentParagraph.trim());
      }
      
      paragraphs = potentialParagraphs.length > 1 ? potentialParagraphs : paragraphs;
    }
    
    return paragraphs.filter(p => p.trim().length > 0);
  }

  /**
   * Split large paragraph into smaller chunks at word boundaries
   */
  private static splitParagraphIntoChunks(
    paragraph: string, 
    maxTokens: number,
    overlapTokens: number
  ): string[] {
    const words = paragraph.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordTokens = this.estimateTokens(word + ' ');
      
      // If adding this word would exceed limit, save current chunk
      if (currentTokens + wordTokens > maxTokens && currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap from previous chunk
        if (overlapTokens > 0 && chunks.length > 0) {
          const overlapWords = this.getOverlapWords(currentChunk, overlapTokens);
          currentChunk = overlapWords + ' ' + word;
          currentTokens = this.estimateTokens(currentChunk);
        } else {
          currentChunk = word;
          currentTokens = wordTokens;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + word;
        currentTokens += wordTokens;
      }
    }
    
    // Add final chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Get overlap words from the end of a chunk
   */
  private static getOverlapWords(chunk: string, overlapTokens: number): string {
    const words = chunk.trim().split(/\s+/);
    let overlapText = '';
    let tokens = 0;
    
    // Work backwards from the end to get overlap
    for (let i = words.length - 1; i >= 0; i--) {
      const word = words[i];
      const wordTokens = this.estimateTokens(word + ' ');
      
      if (tokens + wordTokens > overlapTokens) {
        break;
      }
      
      overlapText = word + (overlapText ? ' ' + overlapText : '');
      tokens += wordTokens;
    }
    
    return overlapText;
  }

  /**
   * Merge small chunks with adjacent chunks to meet minimum size requirement
   */
  private static mergeSmallChunks(
    chunks: string[], 
    minTokens: number,
    maxTokens: number
  ): string[] {
    const mergedChunks: string[] = [];
    let i = 0;
    
    while (i < chunks.length) {
      let currentChunk = chunks[i];
      let currentTokens = this.estimateTokens(currentChunk);
      
      // If chunk is too small, try to merge with next chunk
      while (currentTokens < minTokens && i + 1 < chunks.length) {
        const nextChunk = chunks[i + 1];
        const nextTokens = this.estimateTokens(nextChunk);
        
        // Only merge if combined size doesn't exceed max
        if (currentTokens + nextTokens <= maxTokens) {
          currentChunk += '\n\n' + nextChunk;
          currentTokens += nextTokens;
          i++; // Skip the merged chunk
        } else {
          break;
        }
      }
      
      mergedChunks.push(currentChunk);
      i++;
    }
    
    return mergedChunks;
  }

  /**
   * Main chunking method
   */
  static chunkText(
    text: string, 
    options: ChunkingOptions = {}
  ): ChunkResult[] {
    const {
      maxTokens = this.DEFAULT_MAX_TOKENS,
      minTokens = this.DEFAULT_MIN_TOKENS,
      overlapTokens = this.DEFAULT_OVERLAP_TOKENS,
      preserveParagraphs = true
    } = options;

    if (!text || text.trim().length === 0) {
      return [];
    }

    let rawChunks: string[] = [];

    if (preserveParagraphs) {
      // Split into paragraphs first
      const paragraphs = this.splitIntoParagraphs(text);
      
      for (const paragraph of paragraphs) {
        const paragraphTokens = this.estimateTokens(paragraph);
        
        if (paragraphTokens <= maxTokens) {
          // Paragraph fits in one chunk
          rawChunks.push(paragraph);
        } else {
          // Split large paragraph into smaller chunks
          const paragraphChunks = this.splitParagraphIntoChunks(
            paragraph, 
            maxTokens, 
            overlapTokens
          );
          rawChunks.push(...paragraphChunks);
        }
      }
    } else {
      // Simple word-based chunking without paragraph preservation
      rawChunks = this.splitParagraphIntoChunks(text, maxTokens, overlapTokens);
    }

    // Merge small chunks to meet minimum size requirement
    const mergedChunks = this.mergeSmallChunks(rawChunks, minTokens, maxTokens);

    // Convert to ChunkResult objects with metadata
    const results: ChunkResult[] = [];
    let currentPosition = 0;

    for (let i = 0; i < mergedChunks.length; i++) {
      const chunk = mergedChunks[i];
      const tokenCount = this.estimateTokens(chunk);
      const startPosition = currentPosition;
      const endPosition = startPosition + chunk.length;

      results.push({
        content: chunk,
        tokenCount,
        chunkIndex: i,
        startPosition,
        endPosition,
        chunkType: 'text'
      });

      currentPosition = endPosition;
    }

    return results;
  }

  /**
   * Get chunking statistics
   */
  static getChunkingStats(chunks: ChunkResult[]) {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        totalTokens: 0,
        averageTokensPerChunk: 0,
        minTokens: 0,
        maxTokens: 0
      };
    }

    const tokenCounts = chunks.map(c => c.tokenCount);
    const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0);

    return {
      totalChunks: chunks.length,
      totalTokens,
      averageTokensPerChunk: Math.round(totalTokens / chunks.length),
      minTokens: Math.min(...tokenCounts),
      maxTokens: Math.max(...tokenCounts)
    };
  }
}