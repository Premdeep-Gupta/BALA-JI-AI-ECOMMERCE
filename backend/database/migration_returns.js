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
    
    // 1. Drop old constraint if exists and add updated constraint for order_status
    console.log("🛠️ Modifying orders.order_status check constraint...");
    await database.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
    `);
    
    await database.query(`
      ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
      CHECK (order_status IN ('Processing', 'Order Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned', 'Refunded'));
    `);
    console.log("✅ orders.order_status constraint updated successfully.");

    // 2. Create order_returns table
    console.log("🛠️ Creating order_returns table...");
    await database.query(`
      CREATE TABLE IF NOT EXISTS order_returns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        comments TEXT,
        items JSONB NOT NULL,
        pickup_date DATE NOT NULL,
        pickup_slot VARCHAR(50) NOT NULL,
        media JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Refund Processed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ order_returns table created successfully.");

    console.log("🎉 Database Migration Completed Successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await database.end();
  }
}

runMigration();
