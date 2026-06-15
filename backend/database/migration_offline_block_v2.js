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

    // Add missing block/compliance columns to delivery_agents
    console.log("🛠️  Adding offline_count, blocked_shift_slot, unblock_window_expires_at columns...");
    await database.query(`
      ALTER TABLE delivery_agents
        ADD COLUMN IF NOT EXISTS offline_count         INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS blocked_shift_slot    VARCHAR(10),
        ADD COLUMN IF NOT EXISTS unblock_window_expires_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS unblock_requested_at  TIMESTAMP;
    `);
    console.log("✅ offline_count, blocked_shift_slot, unblock_window_expires_at, unblock_requested_at — added.");

    // Ensure face_descriptor column exists (for face-verification)
    console.log("🛠️  Adding face_descriptor column if missing...");
    await database.query(`
      ALTER TABLE delivery_agents
        ADD COLUMN IF NOT EXISTS face_descriptor JSONB;
    `);
    console.log("✅ face_descriptor column checked/added.");

    // Ensure unblock_request_status default is 'None' not NULL
    console.log("🛠️  Setting default for unblock_request_status...");
    await database.query(`
      ALTER TABLE delivery_agents
        ALTER COLUMN unblock_request_status SET DEFAULT 'None';
    `);
    console.log("✅ unblock_request_status default updated.");

    // Initialize offline_count to 0 for all existing rows where it's NULL
    await database.query(`
      UPDATE delivery_agents SET offline_count = 0 WHERE offline_count IS NULL;
    `);
    console.log("✅ Existing NULL offline_count rows initialized to 0.");

    // Initialize delivery_partner_status to ACTIVE where NULL
    await database.query(`
      UPDATE delivery_agents SET delivery_partner_status = 'ACTIVE' WHERE delivery_partner_status IS NULL;
    `);
    console.log("✅ Existing NULL delivery_partner_status rows set to ACTIVE.");

    console.log("🎉 migration_offline_block_v2 completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await database.end();
  }
}

runMigration();
