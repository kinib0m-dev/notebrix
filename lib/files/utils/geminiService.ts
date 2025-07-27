import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ImageDescriptionOptions {
  maxRetries?: number;
  timeout?: number;
  contextPrompt?: string;
}

export interface ImageDescriptionResult {
  description: string;
  confidence: number;
  model: string;
  processingTime: number;
}

class GeminiImageService {
  private genAI: GoogleGenerativeAI | null = null;
  private isInitialized = false;
  private rateLimitDelay = 1000; // 1 second between requests

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.isInitialized = true;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async describeImageWithModel(
    imageData: string,
    modelName: string,
    prompt: string,
    timeout: number = 30000
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error("Gemini service not initialized");
    }

    const model = this.genAI.getGenerativeModel({ model: modelName });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    );

    const generationPromise = model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const result = await Promise.race([generationPromise, timeoutPromise]);
    const response = await result.response;
    return response.text();
  }

  async describeImage(
    imageData: string,
    options: ImageDescriptionOptions = {}
  ): Promise<ImageDescriptionResult> {
    await this.initialize();

    const {
      maxRetries = 3,
      timeout = 30000,
      contextPrompt = ""
    } = options;

    const basePrompt = `Analyze this image and provide a detailed, educational description. Focus on:
1. What type of visual element this is (diagram, chart, photo, illustration, etc.)
2. Key components, elements, or data shown
3. Important relationships, patterns, or insights
4. Educational context or significance

${contextPrompt ? `Additional context: ${contextPrompt}` : ""}

Provide a clear, comprehensive description in 2-3 sentences that would be useful for learning and understanding the content.`;

    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro-vision"];
    
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (const modelName of models) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Rate limiting
          if (attempt > 1 || modelName !== models[0]) {
            await this.sleep(this.rateLimitDelay);
          }

          const description = await this.describeImageWithModel(
            imageData,
            modelName,
            basePrompt,
            timeout
          );

          const processingTime = Date.now() - startTime;

          return {
            description: description.trim(),
            confidence: this.calculateConfidence(description, modelName, attempt),
            model: modelName,
            processingTime
          };

        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`Attempt ${attempt} failed with model ${modelName}:`, lastError.message);
          
          // If this is a rate limit error, wait longer
          if (lastError.message.includes("rate") || lastError.message.includes("quota")) {
            await this.sleep(this.rateLimitDelay * 2);
          }
        }
      }
    }

    // If all models and retries failed, return empty string as requested
    console.error("All Gemini models failed to describe image:", lastError?.message);
    return {
      description: "",
      confidence: 0,
      model: "none",
      processingTime: Date.now() - startTime
    };
  }

  private calculateConfidence(description: string, model: string, attempt: number): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on model quality
    if (model.includes("pro")) confidence += 0.1;
    if (model.includes("flash")) confidence += 0.05;

    // Reduce confidence for retries
    confidence -= (attempt - 1) * 0.1;

    // Adjust based on description quality
    if (description.length > 100) confidence += 0.05;
    if (description.length < 50) confidence -= 0.1;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  async describeMultipleImages(
    images: Array<{ data: string; context?: string }>,
    options: ImageDescriptionOptions = {}
  ): Promise<ImageDescriptionResult[]> {
    const results: ImageDescriptionResult[] = [];
    
    for (const image of images) {
      const imageOptions = {
        ...options,
        contextPrompt: image.context || options.contextPrompt
      };
      
      const result = await this.describeImage(image.data, imageOptions);
      results.push(result);
      
      // Rate limiting between multiple images
      if (images.length > 1) {
        await this.sleep(this.rateLimitDelay);
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const geminiImageService = new GeminiImageService();