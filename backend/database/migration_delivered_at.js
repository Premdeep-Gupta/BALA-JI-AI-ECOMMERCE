import database from "./db.js";

async function runMigration() {
  try {
    console.log("🔌 Running delivered_at migration...");

    // 1. Add columns to orders table
    await database.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMP;
    `);
    console.log("✅ Columns delivered_at and return_completed_at added to orders table.");

    // 2. Backfill existing completed orders
    const backfillDelivered = await database.query(`
      UPDATE orders 
      SET delivered_at = COALESCE(paid_at, created_at)
      WHERE order_status IN ('Delivered', 'Exchange Completed') 
        AND delivered_at IS NULL
    `);
    console.log(`✅ Backfilled ${backfillDelivered.rowCount} delivered orders.`);

    // 3. Backfill existing returns/exchanges
    const backfillReturned = await database.query(`
      UPDATE orders 
      SET return_completed_at = created_at
      WHERE order_status = 'Returned' 
        AND return_completed_at IS NULL
    `);
    console.log(`✅ Backfilled ${backfillReturned.rowCount} returned orders.`);

    console.log("🎉 Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

runMigration();
