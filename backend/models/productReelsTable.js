import database from "../database/db.js";

export async function createProductReelsTable() {
  try {
    const query = `CREATE TABLE IF NOT EXISTS product_reels (
         id SERIAL PRIMARY KEY,
         product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
         video_url TEXT NOT NULL,
         title VARCHAR(255) NOT NULL,
         category_tag VARCHAR(100),
         views_count INTEGER DEFAULT 0,
         likes_count INTEGER DEFAULT 0,
         music_track VARCHAR(255) DEFAULT 'Lo-fi Beats vol. 1',
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;
    await database.query(query);

    // Dynamic schema migration for Higgsfield 2.0 parameters
    await database.query(`ALTER TABLE product_reels ADD COLUMN IF NOT EXISTS format VARCHAR(100);`);
    await database.query(`ALTER TABLE product_reels ADD COLUMN IF NOT EXISTS hook VARCHAR(255);`);
    await database.query(`ALTER TABLE product_reels ADD COLUMN IF NOT EXISTS scene VARCHAR(255);`);
    
    // Create index on product_id
    await database.query(`CREATE INDEX IF NOT EXISTS idx_reels_product_id ON product_reels(product_id);`);
  } catch (error) {
    console.error("❌ Failed To Create Product Reels Table.", error);
    process.exit(1);
  }
}
