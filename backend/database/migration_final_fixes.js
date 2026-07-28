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

    // 1. Alter table delivery_agents to add address if not exists
    console.log("🛠️ Adding address column to delivery_agents table...");
    await database.query(`
      ALTER TABLE delivery_agents ADD COLUMN IF NOT EXISTS address TEXT;
    `);
    console.log("✅ address column checked/added.");

    // 2. Drop old status check constraint if exists
    console.log("🛠️ Modifying order_returns status check constraint...");
    await database.query(`
      ALTER TABLE order_returns DROP CONSTRAINT IF EXISTS order_returns_status_check;
    `);

    // 3. Re-add status check constraint with 'Picked Up'
    await database.query(`
      ALTER TABLE order_returns ADD CONSTRAINT order_returns_status_check 
      CHECK (status IN ('Pending', 'Under QC', 'Approved', 'Rejected', 'Refund Processed', 'Picked Up'));
    `);
    console.log("✅ order_returns status constraint updated successfully.");

    console.log("🎉 Migration completed successfully.");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await database.end();
  }
}

runMigration();
