/**
 * fix_product_images.js
 * Fixes 248 products with triple/quadruple URL-encoded image URLs.
 * The images column is JSONB containing objects with a "url" key.
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "./config/config.env" });

const { Pool } = pg;

const database = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: String(process.env.PG_PASSWORD),
  port: Number(process.env.PG_PORT),
});

/**
 * Fully decodes a URL that has been encoded multiple times.
 * Keeps decoding until stable (no more change).
 */
function fullyDecodeURL(url) {
  if (!url || typeof url !== "string") return url;
  
  let decoded = url;
  let prev = null;
  let iterations = 0;
  
  while (decoded !== prev && iterations < 10) {
    prev = decoded;
    iterations++;
    try {
      const next = decodeURIComponent(decoded);
      // Only accept the decode if it changed something AND looks like a URL still
      if (next !== decoded) {
        decoded = next;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  
  return decoded;
}

/**
 * Process a single image entry — handles both:
 *   - String format: "https://..."
 *   - Object format: { url: "https://...", public_id: "..." }
 */
function fixImageEntry(img) {
  if (!img) return img;
  
  if (typeof img === "string") {
    return fullyDecodeURL(img);
  }
  
  if (typeof img === "object") {
    const fixed = { ...img };
    if (fixed.url) {
      fixed.url = fullyDecodeURL(fixed.url);
    }
    if (fixed.secure_url) {
      fixed.secure_url = fullyDecodeURL(fixed.secure_url);
    }
    return fixed;
  }
  
  return img;
}

async function fixProductImages() {
  const client = await database.connect();

  try {
    console.log("🔍 Fetching products with broken image URLs...\n");

    const result = await client.query(
      `SELECT id, name, images FROM products WHERE images::text LIKE '%2525%'`
    );

    console.log(`📦 Found ${result.rows.length} products to fix\n`);
    
    let fixedCount = 0;
    let errorCount = 0;

    for (const row of result.rows) {
      try {
        const originalImages = row.images;
        
        if (!Array.isArray(originalImages)) continue;
        
        const fixedImages = originalImages.map(fixImageEntry);
        
        // Double-check there's actually a change
        const hasChanges = JSON.stringify(originalImages) !== JSON.stringify(fixedImages);
        
        if (hasChanges) {
          await client.query(
            "UPDATE products SET images = $1::jsonb WHERE id = $2",
            [JSON.stringify(fixedImages), row.id]
          );
          
          console.log(`✅ Fixed: "${row.name?.slice(0, 50)}"`);
          
          // Show before/after for the first image
          const orig = originalImages[0];
          const fixed = fixedImages[0];
          const origUrl = typeof orig === "object" ? orig?.url : orig;
          const fixedUrl = typeof fixed === "object" ? fixed?.url : fixed;
          
          if (origUrl !== fixedUrl) {
            console.log(`   BEFORE: ...${origUrl?.slice(-80)}`);
            console.log(`   AFTER:  ...${fixedUrl?.slice(-80)}`);
          }
          console.log();
          
          fixedCount++;
        }
      } catch (err) {
        console.error(`❌ Error fixing product ${row.id}: ${err.message}`);
        errorCount++;
      }
    }

    console.log("════════════════════════════════════════");
    console.log(`✅ Successfully fixed: ${fixedCount} products`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} products`);
    }
    console.log("════════════════════════════════════════");
    
    // Verify fix
    const verifyResult = await client.query(
      `SELECT COUNT(*) as cnt FROM products WHERE images::text LIKE '%2525%'`
    );
    const remaining = parseInt(verifyResult.rows[0].cnt);
    
    if (remaining === 0) {
      console.log("🎉 All image URLs are now clean!");
    } else {
      console.log(`⚠️  Still ${remaining} products with broken URLs — may need deeper inspection.`);
    }
    
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await database.end();
  }
}

fixProductImages();
