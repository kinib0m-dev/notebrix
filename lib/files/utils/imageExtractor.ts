import { geminiImageService } from './geminiService';

export interface ExtractedImage {
  data: string; // base64 encoded image data
  mimeType: string;
  position: number; // Character position in document
  pageNumber?: number;
  width?: number;
  height?: number;
  context?: string; // Surrounding text for context
}

export interface ImageExtractionResult {
  images: ExtractedImage[];
  totalImages: number;
  extractionMethod: string;
}

export interface ProcessedImage {
  description: string;
  position: number;
  pageNumber?: number;
  confidence: number;
  processingTime: number;
  model: string;
}

class ImageExtractionService {
  /**
   * Extracts images from PDF using pdf2pic or similar library
   * Note: This is a placeholder implementation. In production, you'd use:
   * - pdf2pic for PDF image extraction
   * - mammoth for DOCX images
   * - Custom parsers for PPTX
   */
  private static async extractImagesFromPDF(_file: File): Promise<ExtractedImage[]> {
    try {
      // This is a placeholder - in production you'd need pdf2pic or similar
      // For now, we'll return an empty array and log that image extraction
      // requires additional dependencies
      console.warn("PDF image extraction requires pdf2pic or similar library");
      console.warn("Install with: bun add pdf2pic sharp");
      
      // TODO: Implement actual PDF image extraction
      // const pdf2pic = require("pdf2pic");
      // const convert = pdf2pic.fromBuffer(await file.arrayBuffer(), {
      //   density: 100,
      //   saveFilename: "untitled",
      //   savePath: "./tmp",
      //   format: "jpg",
      //   width: 800,
      //   height: 600
      // });
      
      return [];
    } catch (error) {
      console.error("Error extracting images from PDF:", error);
      return [];
    }
  }

  /**
   * Extracts images from DOCX files
   */
  private static async extractImagesFromDOCX(_file: File): Promise<ExtractedImage[]> {
    try {
      // This would require additional parsing beyond what LangChain provides
      // You'd need to use the raw DOCX parsing with image extraction
      console.warn("DOCX image extraction requires additional implementation");
      console.warn("Consider using docx parser or mammoth with image extraction");
      
      // TODO: Implement DOCX image extraction
      return [];
    } catch (error) {
      console.error("Error extracting images from DOCX:", error);
      return [];
    }
  }

  /**
   * Extracts images from PPTX files
   */
  private static async extractImagesFromPPTX(_file: File): Promise<ExtractedImage[]> {
    try {
      // Similar to DOCX, this requires specialized parsing
      console.warn("PPTX image extraction requires additional implementation");
      
      // TODO: Implement PPTX image extraction
      return [];
    } catch (error) {
      console.error("Error extracting images from PPTX:", error);
      return [];
    }
  }

  /**
   * Main method to extract images from various file types
   */
  static async extractImages(file: File): Promise<ImageExtractionResult> {
    let images: ExtractedImage[] = [];
    let extractionMethod = "none";

    try {
      switch (file.type) {
        case "application/pdf":
          images = await this.extractImagesFromPDF(file);
          extractionMethod = "pdf-extraction";
          break;
          
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        case "application/msword":
          images = await this.extractImagesFromDOCX(file);
          extractionMethod = "docx-extraction";
          break;
          
        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        case "application/vnd.ms-powerpoint":
          images = await this.extractImagesFromPPTX(file);
          extractionMethod = "pptx-extraction";
          break;
          
        default:
          console.log(`Image extraction not supported for file type: ${file.type}`);
          extractionMethod = "unsupported";
      }
    } catch (error) {
      console.error("Error during image extraction:", error);
      extractionMethod = "error";
    }

    return {
      images,
      totalImages: images.length,
      extractionMethod
    };
  }

  /**
   * Processes extracted images to get descriptions from Gemini
   */
  static async processImagesWithGemini(
    images: ExtractedImage[],
    contextText?: string
  ): Promise<ProcessedImage[]> {
    if (images.length === 0) {
      return [];
    }

    const processedImages: ProcessedImage[] = [];

    try {
      // Process images in batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);
        
        const imageBatch = batch.map(img => ({
          data: img.data,
          context: img.context || contextText
        }));

        const results = await geminiImageService.describeMultipleImages(imageBatch);
        
        for (let j = 0; j < batch.length; j++) {
          const image = batch[j];
          const result = results[j];
          
          if (result.description) {
            processedImages.push({
              description: result.description,
              position: image.position,
              pageNumber: image.pageNumber,
              confidence: result.confidence,
              processingTime: result.processingTime,
              model: result.model
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing images with Gemini:", error);
    }

    return processedImages;
  }

  /**
   * Simulates image detection in text content for cases where actual image extraction isn't available
   * This looks for common image references in the text
   */
  static detectImageReferencesInText(text: string): Array<{ position: number; context: string; type: string }> {
    const imageReferences: Array<{ position: number; context: string; type: string }> = [];
    
    // Common patterns that might indicate images/figures
    const patterns = [
      /(?:figure|fig\.?)\s*\d+/gi,
      /(?:image|img)\s*\d*/gi,
      /(?:diagram|chart|graph)\s*\d*/gi,
      /(?:screenshot|photo|picture)/gi,
      /\[image[^\]]*\]/gi,
      /\(see\s+(?:figure|image|diagram)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const position = match.index;
        const matchText = match[0];
        
        // Get surrounding context (50 characters before and after)
        const start = Math.max(0, position - 50);
        const end = Math.min(text.length, position + matchText.length + 50);
        const context = text.substring(start, end);
        
        // Determine type based on the match
        let type = 'other';
        if (/figure|fig/i.test(matchText)) type = 'diagram';
        else if (/chart|graph/i.test(matchText)) type = 'chart';
        else if (/image|img|photo|picture/i.test(matchText)) type = 'image';
        else if (/diagram/i.test(matchText)) type = 'diagram';
        
        imageReferences.push({
          position,
          context: context.trim(),
          type
        });
      }
    });

    // Remove duplicates based on position proximity
    const filteredReferences = imageReferences.filter((ref, index) => {
      return !imageReferences.slice(0, index).some(
        existing => Math.abs(existing.position - ref.position) < 20
      );
    });

    return filteredReferences.sort((a, b) => a.position - b.position);
  }

  /**
   * Creates mock image descriptions for detected references when actual images aren't available
   */
  static async createMockDescriptionsForReferences(
    references: Array<{ position: number; context: string; type: string }>,
    _fullText: string
  ): Promise<ProcessedImage[]> {
    const mockDescriptions: ProcessedImage[] = [];

    for (const ref of references) {
      // Create a contextual description based on surrounding text
      const description = `[Referenced ${ref.type}] ${ref.context.replace(/\s+/g, ' ')}`;
      
      mockDescriptions.push({
        description,
        position: ref.position,
        confidence: 0.5, // Lower confidence for mock descriptions
        processingTime: 0,
        model: 'text-reference-detection'
      });
    }

    return mockDescriptions;
  }

  /**
   * Comprehensive image processing that combines actual extraction with text-based detection
   */
  static async extractAndProcessImages(
    file: File,
    extractedText: string
  ): Promise<ProcessedImage[]> {
    const processedImages: ProcessedImage[] = [];

    try {
      // First, try to extract actual images
      const extractionResult = await this.extractImages(file);
      
      if (extractionResult.images.length > 0) {
        // Process actual extracted images
        const actualImageDescriptions = await this.processImagesWithGemini(
          extractionResult.images,
          extractedText.substring(0, 500) // First 500 chars for context
        );
        processedImages.push(...actualImageDescriptions);
      }

      // Also detect text references to images/figures
      const imageReferences = this.detectImageReferencesInText(extractedText);
      
      if (imageReferences.length > 0) {
        const mockDescriptions = await this.createMockDescriptionsForReferences(
          imageReferences,
          extractedText
        );
        processedImages.push(...mockDescriptions);
      }

    } catch (error) {
      console.error("Error in extractAndProcessImages:", error);
    }

    // Sort by position
    return processedImages.sort((a, b) => a.position - b.position);
  }
}

export { ImageExtractionService };