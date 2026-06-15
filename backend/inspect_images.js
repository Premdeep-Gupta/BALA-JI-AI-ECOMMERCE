/**
 * inspect_images.js
 * Inspect the products table schema and look for over-encoded image URLs anywhere.
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

async function inspect() {
  const client = await database.connect();

  try {
    // 1. List all columns in products table
    console.log("📋 Products table columns:");
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    cols.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

    // 2. Check which column actually holds the broken URLs
    console.log("\n🔍 Searching ALL string columns for %25%25 patterns...");

    const textCols = cols.rows
      .filter(c => ["text", "character varying", "jsonb", "json"].includes(c.data_type))
      .map(c => c.column_name);

    for (const col of textCols) {
      try {
        let query;
        if (col === "images" || col.includes("image")) {
          // For array/jsonb columns, cast to text
          query = `SELECT COUNT(*) as cnt FROM products WHERE ${col}::text LIKE '%2525%'`;
        } else {
          query = `SELECT COUNT(*) as cnt FROM products WHERE ${col}::text LIKE '%2525%'`;
        }
        const res = await client.query(query);
        const cnt = parseInt(res.rows[0].cnt);
        if (cnt > 0) {
          console.log(`  ❌ FOUND ${cnt} broken URLs in column: "${col}"`);
          
          // Show a sample
          const sample = await client.query(
            `SELECT id, ${col} FROM products WHERE ${col}::text LIKE '%2525%' LIMIT 1`
          );
          if (sample.rows.length > 0) {
            const val = sample.rows[0][col];
            const valStr = typeof val === "object" ? JSON.stringify(val) : String(val);
            console.log(`    Sample: ${valStr.slice(0, 200)}`);
          }
        } else {
          console.log(`  ✅ Column "${col}" is clean`);
        }
      } catch (e) {
        console.log(`  ⚠️  Could not check column "${col}": ${e.message}`);
      }
    }

    // 3. Also check order_items table
    console.log("\n🔍 Checking order_items table...");
    try {
      const oiRes = await client.query(
        `SELECT COUNT(*) as cnt FROM order_items WHERE image::text LIKE '%2525%'`
      );
      console.log(`  order_items.image: ${oiRes.rows[0].cnt} broken URLs`);
      
      if (parseInt(oiRes.rows[0].cnt) > 0) {
        const s = await client.query(
          `SELECT id, image FROM order_items WHERE image::text LIKE '%2525%' LIMIT 1`
        );
        console.log(`  Sample: ${s.rows[0]?.image?.slice(0, 200)}`);
      }
    } catch (e) {
      console.log(`  ⚠️  ${e.message}`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    client.release();
    await database.end();
  }
}

inspect();
