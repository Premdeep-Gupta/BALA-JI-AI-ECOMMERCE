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

async function addImageUrlColumn() {
  try {
    console.log("Altering sales_campaigns table to add ai_image_url column...");
    await database.query(`
      ALTER TABLE sales_campaigns ADD COLUMN IF NOT EXISTS ai_image_url TEXT;
    `);
    console.log("✅ Successfully added ai_image_url column to sales_campaigns table!");
  } catch (err) {
    console.error("❌ Failed to add column:", err);
  } finally {
    await database.end();
  }
}

addImageUrlColumn();
