import database from "../database/db.js";

export async function createFinesTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS fines (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        partner_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Waived', 'Paid'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await database.query(query);
    console.log("✅ Fines Table Created/Updated Successfully");
  } catch (error) {
    console.error("❌ Failed To Create/Update Fines Table.", error);
    process.exit(1);
  }
}
