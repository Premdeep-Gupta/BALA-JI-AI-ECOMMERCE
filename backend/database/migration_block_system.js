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

    // 1. Add block-related columns to delivery_agents
    console.log("🛠️ Altering delivery_agents table to add block & fine columns...");
    await database.query(`
      ALTER TABLE delivery_agents 
      ADD COLUMN IF NOT EXISTS delivery_partner_status VARCHAR(50) DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS block_reason TEXT,
      ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS unblock_request_status VARCHAR(50) DEFAULT 'None',
      ADD COLUMN IF NOT EXISTS unblock_request_reason TEXT;
    `);
    console.log("✅ delivery_agents table columns updated successfully.");

    // 2. Create fines table
    console.log("🛠️ Creating fines table...");
    await database.query(`
      CREATE TABLE IF NOT EXISTS fines (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        partner_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ fines table created successfully.");

    // 3. Create GPS logs table
    console.log("🛠️ Creating delivery_agent_gps_logs table...");
    await database.query(`
      CREATE TABLE IF NOT EXISTS delivery_agent_gps_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        partner_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ delivery_agent_gps_logs table created successfully.");

    // 4. Create Offline Warning / Event logs table
    console.log("🛠️ Creating delivery_agent_offline_logs table...");
    await database.query(`
      CREATE TABLE IF NOT EXISTS delivery_agent_offline_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        partner_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        offline_count INT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ delivery_agent_offline_logs table created successfully.");

    console.log("🎉 Database Migration for Block & Fine System Completed Successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await database.end();
  }
}

runMigration();
