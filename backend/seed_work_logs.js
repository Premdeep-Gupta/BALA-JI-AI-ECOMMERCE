/**
 * seed_work_logs.js
 * Run once to create sample work log entries for existing delivery agents.
 * Usage: node seed_work_logs.js
 */

import database from "./database/db.js";

async function seedWorkLogs() {
  console.log("🌱 Seeding delivery agent work logs...");

  // Get all delivery agents
  const agents = await database.query("SELECT id, name, phone FROM delivery_agents LIMIT 20");

  if (agents.rows.length === 0) {
    console.log("❌ No delivery agents found. Register some agents first.");
    process.exit(0);
  }

  for (const agent of agents.rows) {
    console.log(`\n📦 Seeding for: ${agent.name} (${agent.phone})`);

    // Generate 60 days of work data (last 2 months)
    const shifts = ["Morning (07:00 AM - 01:00 PM)", "Afternoon (01:00 PM - 07:00 PM)", "Evening (07:00 PM - 01:00 AM)"];

    for (let daysAgo = 0; daysAgo < 60; daysAgo++) {
      // Only add data for ~70% of days (random off days)
      if (Math.random() > 0.7) continue;

      const workDate = new Date();
      workDate.setDate(workDate.getDate() - daysAgo);
      const dateStr = workDate.toISOString().split("T")[0];

      // Random shift
      const shiftType = shifts[Math.floor(Math.random() * shifts.length)];

      // Random hours (4-8 hours)
      const hoursWorked = parseFloat((4 + Math.random() * 4).toFixed(2));

      // Random orders (3-15)
      const ordersDelivered = Math.floor(3 + Math.random() * 12);

      // Earnings: ₹50 base per delivery + random bonus
      const earnings = parseFloat((ordersDelivered * 50 + Math.random() * 200).toFixed(2));

      // Shift start time
      let startHour = 7;
      if (shiftType.includes("Afternoon")) startHour = 13;
      else if (shiftType.includes("Evening")) startHour = 19;

      const startTime = new Date(workDate);
      startTime.setHours(startHour, Math.floor(Math.random() * 30), 0, 0);

      const endTime = new Date(startTime.getTime() + hoursWorked * 60 * 60 * 1000);

      // Check if already exists for this date+agent
      const existing = await database.query(
        "SELECT id FROM delivery_agent_work_logs WHERE delivery_agent_id = $1 AND work_date = $2 LIMIT 1",
        [agent.id, dateStr]
      );

      if (existing.rows.length === 0) {
        await database.query(
          `INSERT INTO delivery_agent_work_logs
           (delivery_agent_id, work_date, shift_type, shift_start_time, shift_end_time, hours_worked, orders_delivered, earnings)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [agent.id, dateStr, shiftType, startTime.toISOString(), endTime.toISOString(), hoursWorked, ordersDelivered, earnings]
        );
        console.log(`  ✅ ${dateStr} — ${shiftType.substring(0, 8)}... | ${hoursWorked}h | ${ordersDelivered} orders | ₹${earnings}`);
      } else {
        console.log(`  ⏭  ${dateStr} — already exists, skipping`);
      }
    }
  }

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

seedWorkLogs().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
