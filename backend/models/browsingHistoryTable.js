import database from "../database/db.js";

export async function createBrowsingHistoryTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS browsing_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_id VARCHAR(255) NOT NULL,
        product_id UUID NOT NULL,
        category VARCHAR(100) NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bh_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `;
    await database.query(query);
    console.log("✅ Browsing History Table Created/Verified Successfully");
  } catch (error) {
    console.error("❌ Failed To Create Browsing History Table.", error);
    process.exit(1);
  }
}
