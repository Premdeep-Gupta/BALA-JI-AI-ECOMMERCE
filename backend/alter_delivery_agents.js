import database from "./database/db.js";

async function alterTable() {
  try {
    await database.query(`
      ALTER TABLE delivery_agents 
      ADD COLUMN IF NOT EXISTS aadhaar_url TEXT,
      ADD COLUMN IF NOT EXISTS pan_url TEXT,
      ADD COLUMN IF NOT EXISTS face_descriptor DOUBLE PRECISION[],
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'Pending',
      ADD COLUMN IF NOT EXISTS rejection_reason JSONB;
    `);
    console.log("Successfully altered delivery_agents table!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to alter table:", error);
    process.exit(1);
  }
}

alterTable();
