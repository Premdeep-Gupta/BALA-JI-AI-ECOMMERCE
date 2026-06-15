import database from "../database/db.js";

export async function createDeliveryAgentGpsLogsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS delivery_agent_gps_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        partner_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await database.query(query);
    console.log("✅ Delivery Agent GPS Logs Table Created/Updated Successfully");
  } catch (error) {
    console.error("❌ Failed To Create/Update Delivery Agent GPS Logs Table.", error);
    process.exit(1);
  }
}
