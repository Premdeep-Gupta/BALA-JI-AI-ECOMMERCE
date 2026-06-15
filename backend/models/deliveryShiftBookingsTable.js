import database from "../database/db.js";

export async function createDeliveryShiftBookingsTable() {
  try {
    const query = `
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
      );
    `;
    await database.query(query);
    console.log("✅ Delivery Shift Bookings Table Created/Verified Successfully");
  } catch (error) {
    console.error("❌ Failed To Create Delivery Shift Bookings Table.", error);
    process.exit(1);
  }
}
