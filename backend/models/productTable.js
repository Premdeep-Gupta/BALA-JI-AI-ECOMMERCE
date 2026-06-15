import database from "../database/db.js";

export async function createProductsTable() {
  try {
    const query = `CREATE TABLE IF NOT EXISTS products (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         name VARCHAR(255) NOT NULL,
         description TEXT NOT NULL,
         price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
         category VARCHAR(100) NOT NULL,
         ratings DECIMAL(3,2) DEFAULT 0 CHECK (ratings BETWEEN 0 AND 5),
         images JSONB DEFAULT '[]'::JSONB,
         stock INT NOT NULL CHECK (stock >= 0),
         created_by UUID NOT NULL,
         discount_percentage INTEGER DEFAULT 15,
         embedding real[],
         original_price DECIMAL(10,2) DEFAULT NULL,
         offer_type VARCHAR(50) DEFAULT NULL,
         sub_category VARCHAR(100) DEFAULT NULL,
         video JSONB DEFAULT NULL,
         item_link TEXT DEFAULT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE);`;
    await database.query(query);
    await database.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 15,
      ADD COLUMN IF NOT EXISTS embedding real[],
      ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS offer_type VARCHAR(50) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS video JSONB DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS item_link TEXT DEFAULT NULL;
    `);
  } catch (error) {
    console.error("❌ Failed To Create Products Table.", error);
    process.exit(1);
  }
}