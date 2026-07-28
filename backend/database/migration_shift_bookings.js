import db from "./db.js";

console.log("🔧 Creating delivery_shift_bookings table...\n");

await db.query(`
  CREATE TABLE IF NOT EXISTS delivery_shift_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_slot VARCHAR(10) NOT NULL,
    shift_label VARCHAR(100) NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed', 'active', 'no_show')),
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    UNIQUE(agent_id, shift_date, shift_slot)
  )
`);
console.log("✅ delivery_shift_bookings table created");

// Also add blocked_at_shift column to delivery_agents for tracking which shift they were blocked in
await db.query(`
  ALTER TABLE delivery_agents
  ADD COLUMN IF NOT EXISTS blocked_shift_slot VARCHAR(10),
  ADD COLUMN IF NOT EXISTS unblock_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS unblock_window_expires_at TIMESTAMP
`);
console.log("✅ delivery_agents block tracking columns added");

// Verify
const tables = await db.query(`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'delivery_shift_bookings'
`);
console.log("✅ Verified:", tables.rows[0]?.table_name);

process.exit(0);
