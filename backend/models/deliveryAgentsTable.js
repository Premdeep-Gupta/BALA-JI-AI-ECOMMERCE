import database from "../database/db.js";

export async function createDeliveryAgentsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS delivery_agents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(50) UNIQUE NOT NULL,
        vehicle_number VARCHAR(100),
        avatar_url TEXT,
        agency VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Available',
        password TEXT NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        is_online BOOLEAN DEFAULT FALSE,
        shift_preference VARCHAR(100) DEFAULT 'Morning (07:00 AM - 01:00 PM)',
        shift_start TIME,
        shift_end TIME,
        address TEXT,
        aadhaar_url TEXT,
        pan_url TEXT,
        face_descriptor DOUBLE PRECISION[],
        is_verified BOOLEAN DEFAULT FALSE,
        verification_status VARCHAR(50) DEFAULT 'Pending',
        rejection_reason JSONB,
        delivery_partner_status VARCHAR(50) DEFAULT 'ACTIVE',
        fine_amount DECIMAL(10, 2) DEFAULT 0,
        block_reason TEXT,
        blocked_at TIMESTAMP,
        unblock_request_status VARCHAR(50) DEFAULT 'None',
        unblock_request_reason TEXT,
        blocked_shift_slot VARCHAR(10) DEFAULT NULL,
        unblock_requested_at TIMESTAMP DEFAULT NULL,
        unblock_window_expires_at TIMESTAMP DEFAULT NULL,
        documents JSONB DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await database.query(query);
    await database.query(`
      ALTER TABLE delivery_agents
      ADD COLUMN IF NOT EXISTS blocked_shift_slot VARCHAR(10),
      ADD COLUMN IF NOT EXISTS unblock_requested_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS unblock_window_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT NULL;
    `);
    console.log("✅ Delivery Agents Table Created/Updated Successfully");
  } catch (error) {
    console.error("❌ Failed To Create/Update Delivery Agents Table.", error);
    process.exit(1);
  }
}
