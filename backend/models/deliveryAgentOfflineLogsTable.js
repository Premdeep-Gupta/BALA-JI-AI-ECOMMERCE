import database from "../database/db.js";

export async function createDeliveryAgentOfflineLogsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS delivery_agent_offline_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        partner_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL, -- 'Offline Warning', 'Countdown Started', 'Auto Blocked', 'Appeal Submitted', 'Unblocked', 'Appeal Rejected'
        offline_count INT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await database.query(query);
    console.log("✅ Delivery Agent Offline Logs Table Created/Updated Successfully");
  } catch (error) {
    console.error("❌ Failed To Create/Update Delivery Agent Offline Logs Table.", error);
    process.exit(1);
  }
}
