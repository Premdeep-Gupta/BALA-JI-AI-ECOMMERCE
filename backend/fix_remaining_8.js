/**
 * fix_remaining_8.js
 * Fixes remaining 8 products by using a raw %25 → % replacement approach
 * for cases where decodeURIComponent alone can't decode further.
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
 * Raw string replacement approach: keep replacing %25 with %
 * until the URL doesn't contain %25 any more, but only in
 * contexts where it makes the URL valid.
 */
function rawDecode(url) {
  if (!url || typeof url !== "string") return url;
  
  let result = url;
  // Replace %25 with % up to 10 times
  for (let i = 0; i < 10; i++) {
    const next = result.replace(/%25/gi, "%");
    if (next === result) break;
    result = next;
  }
  return result;
}

async function fixRemaining() {
  const client = await database.connect();

  try {
    const result = await client.query(
      `SELECT id, name, images FROM products WHERE images::text LIKE '%2525%'`
    );

    console.log(`📦 Found ${result.rows.length} products\n`);

    for (const row of result.rows) {
      console.log(`\nProduct: "${row.name?.slice(0, 60)}"`);
      
      const originalImages = row.images;
      if (!Array.isArray(originalImages)) continue;

      // Show raw data
      const rawStr = JSON.stringify(originalImages);
      console.log(`RAW: ${rawStr.slice(0, 300)}`);

      const fixedImages = originalImages.map(img => {
        if (!img) return img;
        
        if (typeof img === "string") {
          return rawDecode(img);
        }
        
        if (typeof img === "object") {
          const fixed = { ...img };
          if (fixed.url) fixed.url = rawDecode(fixed.url);
          if (fixed.secure_url) fixed.secure_url = rawDecode(fixed.secure_url);
          return fixed;
        }
        
        return img;
      });

      const fixedStr = JSON.stringify(fixedImages);
      console.log(`FIXED: ${fixedStr.slice(0, 300)}`);

      if (rawStr !== fixedStr) {
        await client.query(
          "UPDATE products SET images = $1::jsonb WHERE id = $2",
          [fixedStr, row.id]
        );
        console.log(`✅ Updated!`);
      } else {
        console.log(`⚠️  No change detected even after raw decode`);
      }
    }

    // Final check
    const verifyResult = await client.query(
      `SELECT COUNT(*) as cnt FROM products WHERE images::text LIKE '%2525%'`
    );
    console.log(`\n🎯 Remaining broken: ${verifyResult.rows[0].cnt}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await database.end();
  }
}

fixRemaining();
