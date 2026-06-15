import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import database from "./database/db.js";
import { generateImageEmbedding } from "./utils/embeddingEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to resolve absolute local file path or remote URL
async function resolveImageSource(img) {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
    return img;
  }
  const cleanPath = img.startsWith("/") ? img.slice(1) : img;
  const localPaths = [
    path.join(process.cwd(), cleanPath),
    path.join(process.cwd(), "uploads", path.basename(img)),
    path.join(process.cwd(), "server", cleanPath),
    path.join(process.cwd(), "server", "uploads", path.basename(img)),
    path.join("/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/public", cleanPath)
  ];
  for (const p of localPaths) {
    if (await fs.pathExists(p)) {
      return p;
    }
  }
  return null;
}

// Concurrency-limited promise runner
async function runWithLimit(limit, items, iteratorFn) {
  const results = [];
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

async function startEmbeddingProcess() {
  try {
    console.log("🔍 Fetching products with NULL embeddings...");
    const productsRes = await database.query(
      "SELECT id, name, images FROM products WHERE embedding IS NULL ORDER BY created_at DESC"
    );
    const products = productsRes.rows;
    const total = products.length;

    console.log(`📦 Found ${total} products that need visual embeddings.`);
    if (total === 0) {
      console.log("🎉 All products already have embeddings!");
      process.exit(0);
    }

    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;

    // Process with a concurrency limit of 5 to avoid overloading the system
    const concurrencyLimit = 5;

    console.log(`⚡ Generating embeddings using CLIP model (concurrency limit: ${concurrencyLimit})...`);

    await runWithLimit(concurrencyLimit, products, async (prod) => {
      processedCount++;
      const currentIdx = processedCount;

      let imagesList = [];
      try {
        if (Array.isArray(prod.images)) {
          imagesList = prod.images;
        } else if (typeof prod.images === "string") {
          imagesList = JSON.parse(prod.images);
        }
      } catch {
        imagesList = [prod.images];
      }

      let rawImg = imagesList[0];
      if (rawImg && typeof rawImg === "object" && rawImg.url) {
        rawImg = rawImg.url;
      }
      if (!rawImg) {
        console.warn(`[${currentIdx}/${total}] ⚠️ No image found for product: ${prod.name} (ID: ${prod.id})`);
        failCount++;
        return;
      }

      const imageSource = await resolveImageSource(rawImg);
      if (!imageSource) {
        console.warn(`[${currentIdx}/${total}] ⚠️ Could not resolve image path for: ${rawImg}`);
        failCount++;
        return;
      }

      try {
        const embedding = await generateImageEmbedding(imageSource);
        if (embedding && embedding.length > 0) {
          const pgArrayStr = `{${embedding.join(",")}}`;
          await database.query("UPDATE products SET embedding = $1 WHERE id = $2", [pgArrayStr, prod.id]);
          successCount++;
          if (currentIdx % 50 === 0 || currentIdx === total) {
            const percentage = ((currentIdx / total) * 100).toFixed(1);
            console.log(`✨ Progress: ${currentIdx}/${total} products processed (${percentage}%). Success: ${successCount}, Failed: ${failCount}`);
          }
        } else {
          throw new Error("Empty embedding array returned");
        }
      } catch (err) {
        console.error(`[${currentIdx}/${total}] ❌ Failed to process ${prod.name}:`, err.message);
        failCount++;
      }
    });

    console.log("\n🎉 Embedding generation completed!");
    console.log(`- Total: ${total}`);
    console.log(`- Success: ${successCount}`);
    console.log(`- Failed: ${failCount}`);

  } catch (err) {
    console.error("❌ Fatal error in embedding script:", err);
  } finally {
    await database.end();
    process.exit(0);
  }
}

startEmbeddingProcess();
