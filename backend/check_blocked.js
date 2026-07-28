import db from "./database/db.js";

// 1. Show all columns on delivery_agents
const cols = await db.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'delivery_agents' 
  ORDER BY ordinal_position
`);
console.log("\n📋 delivery_agents columns:");
console.table(cols.rows);

// 2. Show blocked agents (only columns that exist)
const blocked = await db.query(`
  SELECT id, name, phone, delivery_partner_status, fine_amount 
  FROM delivery_agents 
  WHERE delivery_partner_status = 'BLOCKED'
`);
console.log("\n🔴 Blocked Agents:");
console.table(blocked.rows);

// 3. Show Premdeep's record
const premdeep = await db.query(`
  SELECT id, name, phone, delivery_partner_status, fine_amount 
  FROM delivery_agents 
  WHERE name ILIKE '%premdeep%' OR phone = '9876543210'
`);
console.log("\n👤 Premdeep record:");
console.table(premdeep.rows);

process.exit(0);
