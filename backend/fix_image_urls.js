/**
 * fix_image_urls.js
 * Fixes triple/quadruple URL-encoded Amazon image URLs in the database.
 * URLs like %252525252B should be decoded back to their clean form.
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
 * Decodes a URL that has been encoded multiple times.
 * Keeps decoding until the URL stabilizes (no more %25 sequences left).
 */
function fullyDecodeURL(url) {
  if (!url || typeof url !== "string") return url;
  
  let decoded = url;
  let prev = null;
  
  // Keep decoding until stable (handles any depth of encoding)
  while (decoded !== prev) {
    prev = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break; // Stop if decoding produces an invalid sequence
    }
  }
  
  return decoded;
}

/**
 * Re-encodes a fully-decoded URL safely.
 * Only encodes characters that are NOT valid in a URL path.
 */
function cleanEncodeURL(url) {
  if (!url || typeof url !== "string") return url;
  
  // Split by the base URL and just encode the filename portion safely
  // Amazon URLs look like: https://images-na.ssl-images-amazon.com/images/I/FILENAME.jpg
  const match = url.match(/^(https?:\/\/[^/]+\/)(.*?)(\.[a-z]+)(\?.*)?$/i);
  if (!match) return url;
  
  const [, base, path, ext, query] = match;
  
  // Re-encode only spaces and truly problematic chars, keeping + as-is (valid in URL paths)
  const cleanPath = path.replace(/ /g, "%20");
  
  return `${base}${cleanPath}${ext}${query || ""}`;
}

async function fixImageUrls() {
  const client = await database.connect();
  
  try {
    console.log("🔍 Scanning products table for over-encoded image URLs...\n");
    
    // Fetch all products with images
    const result = await client.query(
      "SELECT id, images FROM products WHERE images IS NOT NULL"
    );
    
    console.log(`📦 Found ${result.rows.length} products to check\n`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const row of result.rows) {
      const originalImages = row.images; // JSONB array of image URLs
      
      if (!Array.isArray(originalImages) || originalImages.length === 0) {
        skippedCount++;
        continue;
      }
      
      // Decode each image URL
      const fixedImages = originalImages.map((imgUrl) => {
        const decoded = fullyDecodeURL(imgUrl);
        return decoded;
      });
      
      // Check if anything changed
      const hasChanges = JSON.stringify(originalImages) !== JSON.stringify(fixedImages);
      
      if (hasChanges) {
        await client.query(
          "UPDATE products SET images = $1::jsonb WHERE id = $2",
          [JSON.stringify(fixedImages), row.id]
        );
        
        console.log(`✅ Fixed product ${row.id}:`);
        originalImages.forEach((orig, i) => {
          if (orig !== fixedImages[i]) {
            console.log(`   BEFORE: ${orig.slice(0, 80)}...`);
            console.log(`   AFTER:  ${fixedImages[i].slice(0, 80)}...`);
            console.log();
          }
        });
        
        fixedCount++;
      } else {
        skippedCount++;
      }
    }
    
    // Also fix the image_url column if it exists
    try {
      const colCheck = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'image_url'
      `);
      
      if (colCheck.rows.length > 0) {
        console.log("\n🔍 Also checking image_url column...");
        const imgUrlResult = await client.query(
          "SELECT id, image_url FROM products WHERE image_url IS NOT NULL AND image_url LIKE '%25%25%'"
        );
        
        for (const row of imgUrlResult.rows) {
          const fixed = fullyDecodeURL(row.image_url);
          if (fixed !== row.image_url) {
            await client.query(
              "UPDATE products SET image_url = $1 WHERE id = $2",
              [fixed, row.id]
            );
            fixedCount++;
          }
        }
      }
    } catch {
      // image_url column may not exist, that's fine
    }
    
    console.log("\n════════════════════════════════════════");
    console.log(`✅ Fixed: ${fixedCount} products`);
    console.log(`⏭️  Skipped (already clean): ${skippedCount} products`);
    console.log("════════════════════════════════════════");
    console.log("🎉 Image URL fix complete! Restart your server.\n");
    
  } catch (error) {
    console.error("❌ Error fixing image URLs:", error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await database.end();
  }
}

fixImageUrls();
