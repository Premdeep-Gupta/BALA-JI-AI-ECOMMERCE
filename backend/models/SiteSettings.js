import database from "../database/db.js";

export async function createSiteSettingsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`;
    await database.query(query);
  } catch (error) {
    console.error("❌ Failed To Create Site Settings Table.", error);
  }
}
