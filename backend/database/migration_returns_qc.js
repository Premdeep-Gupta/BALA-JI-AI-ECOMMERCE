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

async function runMigration() {
  try {
    console.log("🔌 Connecting to PostgreSQL database...");
    
    // 1. Drop old constraint if exists on order_returns status check
    console.log("🛠️ Modifying order_returns status check constraint...");
    await database.query(`
      ALTER TABLE order_returns DROP CONSTRAINT IF EXISTS order_returns_status_check;
    `);
    
    await database.query(`
      ALTER TABLE order_returns ADD CONSTRAINT order_returns_status_check 
      CHECK (status IN ('Pending', 'Under QC', 'Approved', 'Rejected', 'Refund Processed', 'Picked Up'));
    `);
    console.log("✅ order_returns status constraint updated successfully.");

    // 2. Add qc_report and refund_details columns if they do not exist
    console.log("🛠️ Adding qc_report and refund_details columns...");
    await database.query(`
      ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS qc_report JSONB DEFAULT '{}'::jsonb;
    `);
    await database.query(`
      ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS refund_details JSONB DEFAULT '{}'::jsonb;
    `);
    console.log("✅ New columns added successfully.");

    console.log("🎉 Database Migration Completed Successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await database.end();
  }
}

runMigration();
