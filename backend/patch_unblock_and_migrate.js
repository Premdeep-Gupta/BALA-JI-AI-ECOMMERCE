import db from "./database/db.js";

console.log("🔧 Running patch migration...\n");

// 1. Add missing offline_count column if not exists
await db.query(`
  ALTER TABLE delivery_agents 
  ADD COLUMN IF NOT EXISTS offline_count INTEGER DEFAULT 0
`);
console.log("✅ offline_count column added (or already exists)");

// 2. Unblock PREMDEEP GUPTA (phone: 9110107775) and clear fine
await db.query(`
  UPDATE delivery_agents 
  SET delivery_partner_status = 'ACTIVE',
      fine_amount = 0,
      block_reason = NULL,
      blocked_at = NULL,
      unblock_request_status = NULL,
      unblock_request_reason = NULL,
      offline_count = 0
  WHERE delivery_partner_status = 'BLOCKED'
`);
console.log("✅ All blocked agents unblocked (BLOCKED → ACTIVE)");

// 3. Verify
const check = await db.query(`
  SELECT id, name, phone, delivery_partner_status, fine_amount, offline_count
  FROM delivery_agents
  ORDER BY created_at DESC
  LIMIT 10
`);
console.log("\n📋 Current delivery_agents state:");
console.table(check.rows);

process.exit(0);
