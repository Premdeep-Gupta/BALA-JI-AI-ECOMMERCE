import database from "../database/db.js";

export async function createOrderReturnsTable() {
  try {
    const query = `
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
        status VARCHAR(50) DEFAULT 'Pending',
        qc_report JSONB DEFAULT '{}'::jsonb,
        refund_details JSONB DEFAULT '{}'::jsonb,
        refund_method VARCHAR(50) DEFAULT NULL,
        bank_details JSONB DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await database.query(query);

    // Alter table to add qc_report and refund_details if they don't exist for existing databases
    await database.query(`
      ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS qc_report JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS refund_details JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50) DEFAULT NULL;
      ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT NULL;
    `);

    // Drop constraint and re-add to match final QC status check constraint
    await database.query(`
      ALTER TABLE order_returns DROP CONSTRAINT IF EXISTS order_returns_status_check;
      ALTER TABLE order_returns ADD CONSTRAINT order_returns_status_check 
      CHECK (status IN ('Pending', 'Under QC', 'Approved', 'Rejected', 'Refund Processed', 'Picked Up'));
    `);

    console.log("✅ Order Returns Table Created/Verified Successfully");
  } catch (error) {
    console.error("❌ Failed To Create Order Returns Table.", error);
    process.exit(1);
  }
}
