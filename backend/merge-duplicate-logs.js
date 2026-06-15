import database from "./database/db.js";

async function main() {
  console.log("🔄 Starting work log merging process...");

  // Get all agents
  const agentsRes = await database.query("SELECT id, name FROM delivery_agents");
  
  for (const agent of agentsRes.rows) {
    console.log(`Processing agent: ${agent.name} (${agent.id})`);
    
    // Get all work logs for this agent
    const logsRes = await database.query(
      "SELECT * FROM delivery_agent_work_logs WHERE delivery_agent_id = $1 ORDER BY work_date ASC, created_at ASC",
      [agent.id]
    );

    // Group by date string (YYYY-MM-DD)
    const groups = {};
    for (const log of logsRes.rows) {
      const d = new Date(log.work_date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(log);
    }

    for (const [dateStr, logs] of Object.entries(groups)) {
      if (logs.length > 1) {
        console.log(`  Found ${logs.length} logs for date ${dateStr}. Merging...`);
        
        // Accumulate values
        let totalHours = 0;
        let totalOrders = 0;
        let totalBasePay = 0;
        let totalIncentives = 0;
        let totalEarnings = 0;
        let minStart = logs[0].shift_start_time;
        let maxEnd = logs[0].shift_end_time;
        let hasActive = false; // if any log is active (shift_end_time is null)

        for (const log of logs) {
          totalHours += parseFloat(log.hours_worked || 0);
          totalOrders += parseInt(log.orders_delivered || 0);
          totalBasePay += parseFloat(log.base_pay || 0);
          totalIncentives += parseFloat(log.incentives || 0);
          totalEarnings += parseFloat(log.earnings || 0);
          
          if (new Date(log.shift_start_time) < new Date(minStart)) {
            minStart = log.shift_start_time;
          }
          if (log.shift_end_time === null) {
            hasActive = true;
          } else if (maxEnd !== null && new Date(log.shift_end_time) > new Date(maxEnd)) {
            maxEnd = log.shift_end_time;
          }
        }

        const keepLog = logs[0];
        const deleteIds = logs.slice(1).map(l => l.id);

        // Update the log we keep
        await database.query(
          `UPDATE delivery_agent_work_logs 
           SET hours_worked = $1,
               orders_delivered = $2,
               base_pay = $3,
               incentives = $4,
               earnings = $5,
               shift_start_time = $6,
               shift_end_time = $7
           WHERE id = $8`,
          [
            totalHours,
            totalOrders,
            totalBasePay,
            totalIncentives,
            totalEarnings,
            minStart,
            hasActive ? null : maxEnd,
            keepLog.id
          ]
        );

        // Delete other logs
        await database.query(
          "DELETE FROM delivery_agent_work_logs WHERE id = ANY($1::uuid[])",
          [deleteIds]
        );
        console.log(`  Merged ${deleteIds.length} duplicate logs into log ID ${keepLog.id}`);
      }
    }
  }

  console.log("✅ Merging process complete!");
  process.exit(0);
}

main().catch(console.error);
