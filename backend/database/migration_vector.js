import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", "config", "config.env") });

const { Pool } = pg;
const database = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: String(process.env.PG_PASSWORD),
  port: Number(process.env.PG_PORT),
});

async function migrateVector() {
  try {
    console.log("Starting Vector DB Migration (without pgvector)...");

    // 1. Add embedding column to products if not exists
    console.log("Adding embedding real[] column to products table...");
    await database.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS embedding real[];
    `);
    console.log("✅ Verified product.embedding column.");

    // 2. Create PL/pgSQL function for cosine similarity
    console.log("Creating cosine_similarity function...");
    await database.query(`
      CREATE OR REPLACE FUNCTION cosine_similarity(a real[], b real[])
      RETURNS real AS $$
      DECLARE
          dot_product real := 0;
          norm_a real := 0;
          norm_b real := 0;
          i integer;
      BEGIN
          IF array_length(a, 1) != array_length(b, 1) THEN
              RETURN NULL;
          END IF;
          
          FOR i IN 1..array_length(a, 1) LOOP
              dot_product := dot_product + a[i] * b[i];
              norm_a := norm_a + a[i] * a[i];
              norm_b := norm_b + b[i] * b[i];
          END LOOP;
          
          IF norm_a = 0 OR norm_b = 0 THEN
              RETURN 0;
          END IF;
          
          RETURN dot_product / (sqrt(norm_a) * sqrt(norm_b));
      END;
      $$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;
    `);
    console.log("✅ Created cosine_similarity function.");

    console.log("🎉 Vector Database Migration Completed Successfully!");
  } catch (err) {
    console.error("❌ Vector Database Migration Failed:", err);
  } finally {
    await database.end();
  }
}

migrateVector();
