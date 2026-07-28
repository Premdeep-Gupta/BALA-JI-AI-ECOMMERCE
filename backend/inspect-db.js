import database from "./database/db.js";

async function main() {
  const agentId = 'e95ba029-456c-4bfa-9dde-07afbe889461';

  const logs = await database.query(
    "SELECT work_date, COUNT(*), SUM(orders_delivered) as delivered, SUM(earnings) as earnings FROM delivery_agent_work_logs WHERE delivery_agent_id = $1 GROUP BY work_date ORDER BY work_date DESC",
    [agentId]
  );
  console.log("--- WORK LOGS BY DATE ---");
  console.log(logs.rows);

  process.exit(0);
}

main().catch(console.error);
