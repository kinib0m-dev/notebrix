export interface ChunkMetadata {
  chunkIndex: number;
  tokenCount: number;
  startPosition?: number;
  endPosition?: number;
  sourceType: 'text' | 'image' | 'table' | 'diagram';
  pageNumber?: number;
  paragraphIndex?: number;
  hasImages?: boolean;
  imageDescriptions?: string[];
}

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkingOptions {
  maxTokens?: number;
  preserveSentences?: boolean;
  mergeShortChunks?: boolean;
  minChunkTokens?: number;
}

export class SmartChunkingService {
  private static readonly DEFAULT_MAX_TOKENS = 1000;
  private static readonly DEFAULT_MIN_TOKENS = 50;
  private static readonly SENTENCE_ENDINGS = /[.!?]+/g;
  private static readonly PARAGRAPH_SEPARATOR = /\n\s*\n/g;

  /**
   * Estimates token count using word-based approximation
   * Average: 1 token ≈ 0.75 words, so 1 word ≈ 1.33 tokens
   */
  private static estimateTokens(text: string): number {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return Math.ceil(words.length * 1.33);
  }

  /**
   * Splits text into sentences while preserving sentence boundaries
   */
  private static splitIntoSentences(text: string): string[] {
    const sentences: string[] = [];
    const parts = text.split(this.SENTENCE_ENDINGS);
    
    for (let i = 0; i < parts.length - 1; i++) {
      const sentence = parts[i].trim();
      if (sentence) {
        // Find the ending punctuation between this part and the next
        const endingMatch = text.substring(
          text.indexOf(sentence) + sentence.length
        ).match(/^[.!?]+/);
        
        sentences.push(sentence + (endingMatch ? endingMatch[0] : '.'));
      }
    }
    
    // Add the last part if it doesn't end with punctuation
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart) {
      sentences.push(lastPart);
    }
    
    return sentences.filter(s => s.length > 0);
  }

  /**
   * Splits a large paragraph into smaller chunks while preserving sentence boundaries
   */
  private static splitParagraph(
    paragraph: string,
    maxTokens: number,
    preserveSentences: boolean
  ): string[] {
    if (!preserveSentences) {
      // Simple word-based splitting if sentence preservation is disabled
      const words = paragraph.split(/\s+/);
      const chunks: string[] = [];
      let currentChunk: string[] = [];
      let currentTokens = 0;

      for (const word of words) {
        const wordTokens = this.estimateTokens(word);
        
        if (currentTokens + wordTokens > maxTokens && currentChunk.length > 0) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [word];
          currentTokens = wordTokens;
        } else {
          currentChunk.push(word);
          currentTokens += wordTokens;
        }
      }
      
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
      }
      
      return chunks;
    }

    const sentences = this.splitIntoSentences(paragraph);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);
      
      // If a single sentence exceeds maxTokens, split it by words
      if (sentenceTokens > maxTokens) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
          currentTokens = 0;
        }
        
        const wordChunks = this.splitParagraph(sentence, maxTokens, false);
        chunks.push(...wordChunks);
        continue;
      }
      
      // If adding this sentence would exceed maxTokens, start a new chunk
      if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [sentence];
        currentTokens = sentenceTokens;
      } else {
        currentChunk.push(sentence);
        currentTokens += sentenceTokens;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    
    return chunks;
  }

  /**
   * Merges consecutive short chunks to optimize chunk sizes
   */
  private static mergeShortChunks(
    chunks: string[],
    maxTokens: number,
    _minTokens: number
  ): string[] {
    const mergedChunks: string[] = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (const chunk of chunks) {
      const chunkTokens = this.estimateTokens(chunk);
      
      if (currentTokens + chunkTokens <= maxTokens) {
        currentChunk = currentChunk ? `${currentChunk}\n\n${chunk}` : chunk;
        currentTokens += chunkTokens;
      } else {
        if (currentChunk) {
          mergedChunks.push(currentChunk);
        }
        currentChunk = chunk;
        currentTokens = chunkTokens;
      }
    }
    
    if (currentChunk) {
      mergedChunks.push(currentChunk);
    }
    
    return mergedChunks;
  }

  /**
   * Main chunking method that processes text into optimal chunks
   */
  static chunkText(text: string, options: ChunkingOptions = {}): TextChunk[] {
    const {
      maxTokens = this.DEFAULT_MAX_TOKENS,
      preserveSentences = true,
      mergeShortChunks = true,
      minChunkTokens = this.DEFAULT_MIN_TOKENS
    } = options;

    // Split text into paragraphs
    const paragraphs = text.split(this.PARAGRAPH_SEPARATOR)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const chunks: TextChunk[] = [];
    let chunkIndex = 0;
    let currentPosition = 0;

    for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex++) {
      const paragraph = paragraphs[paragraphIndex];
      const paragraphTokens = this.estimateTokens(paragraph);

      if (paragraphTokens <= maxTokens) {
        // Paragraph fits in one chunk
        chunks.push({
          content: paragraph,
          metadata: {
            chunkIndex: chunkIndex++,
            tokenCount: paragraphTokens,
            startPosition: currentPosition,
            endPosition: currentPosition + paragraph.length,
            sourceType: 'text',
            paragraphIndex,
            hasImages: false,
            imageDescriptions: []
          }
        });
      } else {
        // Split paragraph into multiple chunks
        const paragraphChunks = this.splitParagraph(paragraph, maxTokens, preserveSentences);
        
        for (const chunkContent of paragraphChunks) {
          const tokenCount = this.estimateTokens(chunkContent);
          chunks.push({
            content: chunkContent,
            metadata: {
              chunkIndex: chunkIndex++,
              tokenCount,
              startPosition: currentPosition,
              endPosition: currentPosition + chunkContent.length,
              sourceType: 'text',
              paragraphIndex,
              hasImages: false,
              imageDescriptions: []
            }
          });
          currentPosition += chunkContent.length;
        }
      }
      
      currentPosition += paragraph.length + 2; // +2 for paragraph separator
    }

    // Merge short chunks if enabled
    if (mergeShortChunks) {
      const shortChunks = chunks.filter(chunk => chunk.metadata.tokenCount < minChunkTokens);
      if (shortChunks.length > 0) {
        const chunkContents = chunks.map(chunk => chunk.content);
        const mergedContents = this.mergeShortChunks(chunkContents, maxTokens, minChunkTokens);
        
        // Rebuild chunks with merged content
        const mergedChunks: TextChunk[] = [];
        let newChunkIndex = 0;
        
        for (const content of mergedContents) {
          const tokenCount = this.estimateTokens(content);
          mergedChunks.push({
            content,
            metadata: {
              chunkIndex: newChunkIndex++,
              tokenCount,
              sourceType: 'text',
              hasImages: false,
              imageDescriptions: []
            }
          });
        }
        
        return mergedChunks;
      }
    }

    return chunks;
  }

  /**
   * Adds image description to a chunk or creates a new chunk for it
   */
  static addImageToChunk(
    chunks: TextChunk[],
    imageDescription: string,
    insertPosition: number,
    contextInfo?: { pageNumber?: number; position?: unknown }
  ): TextChunk[] {
    if (!imageDescription.trim()) {
      return chunks; // No description to add
    }

    // Find the chunk that contains or is closest to the insert position
    let targetChunkIndex = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.metadata.startPosition && chunk.metadata.endPosition) {
        if (insertPosition >= chunk.metadata.startPosition && insertPosition <= chunk.metadata.endPosition) {
          targetChunkIndex = i;
          break;
        } else if (chunk.metadata.startPosition > insertPosition) {
          targetChunkIndex = Math.max(0, i - 1);
          break;
        }
      }
      targetChunkIndex = i;
    }

    const imageDescriptionText = `[Image Description: ${imageDescription}]`;
    const imageTokens = this.estimateTokens(imageDescriptionText);
    
    const targetChunk = chunks[targetChunkIndex];
    const availableTokens = this.DEFAULT_MAX_TOKENS - targetChunk.metadata.tokenCount;

    if (availableTokens >= imageTokens) {
      // Add to existing chunk
      const updatedChunk: TextChunk = {
        ...targetChunk,
        content: `${targetChunk.content}\n\n${imageDescriptionText}`,
        metadata: {
          ...targetChunk.metadata,
          tokenCount: targetChunk.metadata.tokenCount + imageTokens,
          hasImages: true,
          imageDescriptions: [...(targetChunk.metadata.imageDescriptions || []), imageDescription],
          pageNumber: contextInfo?.pageNumber || targetChunk.metadata.pageNumber
        }
      };
      
      const newChunks = [...chunks];
      newChunks[targetChunkIndex] = updatedChunk;
      return newChunks;
    } else {
      // Create new chunk for image description
      const imageChunk: TextChunk = {
        content: imageDescriptionText,
        metadata: {
          chunkIndex: targetChunk.metadata.chunkIndex + 0.5, // Insert between chunks
          tokenCount: imageTokens,
          sourceType: 'image',
          hasImages: true,
          imageDescriptions: [imageDescription],
          pageNumber: contextInfo?.pageNumber
        }
      };
      
      const newChunks = [...chunks];
      newChunks.splice(targetChunkIndex + 1, 0, imageChunk);
      
      // Re-index chunks
      newChunks.forEach((chunk, index) => {
        chunk.metadata.chunkIndex = index;
      });
      
      return newChunks;
    }
  }

  /**
   * Processes text with embedded image descriptions
   */
  static chunkTextWithImages(
    text: string,
    imageDescriptions: Array<{ description: string; position: number; pageNumber?: number; context?: unknown }>,
    options: ChunkingOptions = {}
  ): TextChunk[] {
    // First, create initial text chunks
    let chunks = this.chunkText(text, options);
    
    // Sort image descriptions by position
    const sortedImages = imageDescriptions
      .filter(img => img.description.trim())
      .sort((a, b) => a.position - b.position);
    
    // Add each image description to the appropriate chunk
    for (const image of sortedImages) {
      chunks = this.addImageToChunk(
        chunks,
        image.description,
        image.position,
        { pageNumber: image.pageNumber, position: image.context }
      );
    }
    
    return chunks;
  }
}