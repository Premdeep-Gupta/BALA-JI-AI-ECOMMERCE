import database from "./database/db.js";

async function migrate() {
  try {
    console.log("🔌 Connecting to database for migration...");
    await database.query(`
      ALTER TABLE delivery_agents 
      ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT NULL;
    `);
    console.log("✅ Successfully added 'documents' JSONB column to delivery_agents table!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to migrate database:", error);
    process.exit(1);
  }
}

migrate();
