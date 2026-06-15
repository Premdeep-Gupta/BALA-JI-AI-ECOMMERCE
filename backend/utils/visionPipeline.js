import { pipeline, env } from '@xenova/transformers';
import { Jimp, JimpMime } from 'jimp';
import { generateImageEmbedding } from './embeddingEngine.js';

env.allowLocalModels = false;
env.useBrowserCache = false;

let objectDetector = null;

async function getObjectDetector() {
  if (process.env.DISABLE_LOCAL_ML === "true" || process.env.NODE_ENV === "production") {
    console.log("⚠️ Production/Resource-constrained environment: Skipping local DETR model loading.");
    return null;
  }
  if (!objectDetector) {
    console.log("Loading DETR Object Detection Model...");
    objectDetector = await pipeline('object-detection', 'Xenova/detr-resnet-50');
    console.log("✅ Object Detection Model Loaded.");
  }
  return objectDetector;
}

/**
 * Safe Advanced Vision Pipeline:
 * 1. Detect multiple objects
 * 2. Crop objects using Jimp (Pure JS to prevent native macOS crashes)
 * 3. Generate CLIP embedding for each object
 */
export async function processMultiObjectImage(imagePath) {
  try {
    const detector = await getObjectDetector();
    if (!detector) {
      console.log("⚠️ Skipping object detection, returning full image embedding.");
      const embedding = await generateImageEmbedding(imagePath);
      return [{ label: "Main Object", embedding, box: null }];
    }
    
    console.log("🔍 Running Object Detection...");
    // Transformers pipeline takes the path string directly
    const detections = await detector(imagePath);
    
    const validObjects = detections.filter(d => d.score > 0.8 && d.label !== 'person'); 
    
    if (validObjects.length === 0) {
      console.log("⚠️ No distinct high-confidence objects found, processing full image.");
      const embedding = await generateImageEmbedding(imagePath);
      return [{ label: "Main Object", embedding, box: null }];
    }

    console.log(`📦 Found ${validObjects.length} distinct objects.`);
    const results = [];
    
    // Load image with Jimp for safe pure-JS cropping
    const image = await Jimp.read(imagePath);
    const imgWidth = image.width;
    const imgHeight = image.height;

    for (const obj of validObjects) {
      const { xmin, ymin, xmax, ymax } = obj.box;
      
      const left = Math.max(0, Math.floor(xmin));
      const top = Math.max(0, Math.floor(ymin));
      const width = Math.min(imgWidth - left, Math.ceil(xmax - xmin));
      const height = Math.min(imgHeight - top, Math.ceil(ymax - ymin));

      if (width <= 0 || height <= 0) continue;

      // Crop the object safely (Jimp v1 API)
      const croppedImage = image.clone().crop({ x: left, y: top, w: width, h: height });
      
      // Get buffer to pass to CLIP model
      const croppedBuffer = await croppedImage.getBuffer(JimpMime.jpeg);

      // Generate Embedding
      const embedding = await generateImageEmbedding(croppedBuffer);
      
      // Calculate relative bounding box for UI mapping (0 to 1 scale)
      const relativeBox = {
        left: (left / imgWidth) * 100,
        top: (top / imgHeight) * 100,
        width: (width / imgWidth) * 100,
        height: (height / imgHeight) * 100
      };

      results.push({
        label: obj.label,
        box: relativeBox,
        embedding
      });
    }

    return results;
  } catch (error) {
    console.error("❌ Multi-Object Pipeline Error:", error);
    // Safe fallback to full image
    const embedding = await generateImageEmbedding(imagePath);
    return [{ label: "Fallback Object", embedding, box: null }];
  }
}
