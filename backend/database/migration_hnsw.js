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

async function migrateTracking() {
  try {
    console.log("Starting Personalization Tracking Migration...");

    // 1. Update browsing history table to track search clicks for personalization
    console.log("Updating browsing_history to support search click tracking...");
    await database.query(`
      ALTER TABLE browsing_history 
      ADD COLUMN IF NOT EXISTS search_query VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_visual_search BOOLEAN DEFAULT FALSE;
    `);
    console.log("✅ Updated browsing_history table.");

    // 2. Create product_stats table for self-learning ranking
    console.log("Creating product_stats table for Self-Learning Ranking...");
    await database.query(`
      CREATE TABLE IF NOT EXISTS product_stats (
        product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
        visual_search_clicks INTEGER DEFAULT 0,
        visual_search_purchases INTEGER DEFAULT 0,
        last_clicked_at TIMESTAMP
      );
    `);
    console.log("✅ Created product_stats table.");

    console.log("🎉 Personalization Migration Completed Successfully!");
  } catch (err) {
    console.error("❌ Migration Failed:", err);
  } finally {
    await database.end();
  }
}

migrateTracking();
