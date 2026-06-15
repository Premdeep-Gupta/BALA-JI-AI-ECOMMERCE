import database from "../database/db.js";

export async function createDeliveryAgentWorkLogsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS delivery_agent_work_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        delivery_agent_id UUID REFERENCES delivery_agents(id) ON DELETE CASCADE,
        work_date DATE DEFAULT CURRENT_DATE,
        shift_type VARCHAR(100) DEFAULT 'Morning (07:00 AM - 01:00 PM)',
        shift_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        shift_end_time TIMESTAMP,
        hours_worked DECIMAL(5, 2) DEFAULT 0.00,
        orders_delivered INTEGER DEFAULT 0,
        base_pay DECIMAL(10, 2) DEFAULT 0.00,
        incentives DECIMAL(10, 2) DEFAULT 0.00,
        earnings DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE delivery_agent_work_logs ADD COLUMN IF NOT EXISTS incentives DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE delivery_agent_work_logs ADD COLUMN IF NOT EXISTS base_pay DECIMAL(10,2) DEFAULT 0.00;
    `;
    await database.query(query);
    console.log("✅ Delivery Agent Work Logs Table Created/Updated Successfully");
  } catch (error) {
    console.error("❌ Failed To Create/Update Delivery Agent Work Logs Table.", error);
    process.exit(1);
  }
}
