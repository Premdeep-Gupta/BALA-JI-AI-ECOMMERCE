import { pipeline, env } from '@xenova/transformers';

// Disable local models to download from Hugging Face if not present locally
env.allowLocalModels = false;
env.useBrowserCache = false; 

let extractor = null;

/**
 * Initializes the CLIP vision model.
 */
async function getExtractor() {
  if (process.env.DISABLE_LOCAL_ML === "true" || process.env.NODE_ENV === "production") {
    console.log("⚠️ Production/Resource-constrained environment: Skipping local CLIP model loading.");
    return null;
  }
  if (!extractor) {
    console.log("Loading CLIP Vision Model (this may take a moment on first run)...");
    // We use a small CLIP model (e.g., openai/clip-vit-base-patch32) 
    // for extracting 512-D vector embeddings from images.
    extractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');
    console.log("✅ CLIP Vision Model Loaded.");
  }
  return extractor;
}

/**
 * Generates a 512-D embedding array from an image URL or Buffer/Base64.
 * @param {string|Buffer} imageSource - URL or Buffer of the image.
 * @returns {Promise<number[]>} 512-D vector as an array of numbers.
 */
export async function generateImageEmbedding(imageSource) {
  try {
    const ext = await getExtractor();
    if (!ext) {
      console.log("⚠️ Using Mock 512-D Embedding Fallback...");
      return Array.from({ length: 512 }, () => Math.random() * 2 - 1);
    }
    
    // The pipeline returns a Tensor.
    const output = await ext(imageSource);
    
    // We get the raw data array from the tensor. 
    // For clip-vit-base-patch32, the output shape for a single image is typically [1, 512].
    // Note: Some models output [1, 50, 768] (sequence of patch embeddings + CLS token).
    // The image-feature-extraction pipeline for CLIP automatically pools it to [1, 512].
    const embedding = Array.from(output.data);
    
    return embedding;
  } catch (error) {
    console.error("❌ Error generating image embedding:", error);
    throw error;
  }
}

// Pre-load model asynchronously
getExtractor().catch(console.error);
