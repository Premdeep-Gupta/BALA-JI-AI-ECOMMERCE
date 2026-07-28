import database from "../database/db.js";
export async function createOrdersTable() {
  try {
    const query = `CREATE TABLE IF NOT EXISTS orders (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         buyer_id UUID NOT NULL,
         total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
         tax_price DECIMAL(10,2) NOT NULL CHECK (tax_price >= 0),
         shipping_price DECIMAL(10,2) NOT NULL CHECK (shipping_price >= 0),
         order_status VARCHAR(50) DEFAULT 'Processing',
         paid_at TIMESTAMP CHECK (paid_at IS NULL OR paid_at <= CURRENT_TIMESTAMP),
         delivered_at TIMESTAMP DEFAULT NULL,
         return_completed_at TIMESTAMP DEFAULT NULL,
         delivery_boy_name VARCHAR(100) DEFAULT NULL,
         delivery_boy_phone VARCHAR(20) DEFAULT NULL,
         delivery_boy_vehicle VARCHAR(50) DEFAULT NULL,
         delivery_otp VARCHAR(6) DEFAULT NULL,
         payment_mode VARCHAR(50) DEFAULT 'Prepaid',
         delivery_boy_photo TEXT DEFAULT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE);`;
    await database.query(query);
    await database.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS delivery_boy_name VARCHAR(100) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS delivery_boy_phone VARCHAR(20) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS delivery_boy_vehicle VARCHAR(50) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(6) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50) DEFAULT 'Prepaid',
      ADD COLUMN IF NOT EXISTS delivery_boy_photo TEXT DEFAULT NULL;
    `);
    await database.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
      ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
      CHECK (order_status IN ('Processing', 'Order Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned', 'Refunded', 'Exchange Completed', 'Exchange Out for Delivery'));
    `);
  } catch (error) {
    console.error("❌ Failed To Create Orders Table.", error);
    process.exit(1);
  }
}
