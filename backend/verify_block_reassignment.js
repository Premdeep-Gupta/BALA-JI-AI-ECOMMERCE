import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "config", "config.env") });

const { Pool } = pg;
const db = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: String(process.env.PG_PASSWORD),
  port: Number(process.env.PG_PORT),
});

async function runTest() {
  console.log("🧪 Starting Backend Compliance Block & Reassignment Verification Test...");

  try {
    // 1. Create a dummy blocked agent
    console.log("👤 Creating agent DB_BLOCKED_TEST...");
    const blockedAgentRes = await db.query(`
      INSERT INTO delivery_agents (name, phone, password, is_online, shift_preference, is_verified, verification_status, delivery_partner_status, latitude, longitude)
      VALUES ('Blocked Agent Test', '9999999990', 'dummy', TRUE, 'Morning (07:00 AM - 01:00 PM)', TRUE, 'Approved', 'ACTIVE', 22.5850, 88.4200)
      ON CONFLICT (phone) DO UPDATE 
      SET is_online = TRUE, delivery_partner_status = 'ACTIVE', fine_amount = 0
      RETURNING id, phone, name
    `);
    const blockedAgent = blockedAgentRes.rows[0];
    console.log(`✅ Dummy Agent ID: ${blockedAgent.id}, Phone: ${blockedAgent.phone}`);

    // 2. Create a dummy active agent
    console.log("👤 Creating agent DB_ACTIVE_TEST...");
    const activeAgentRes = await db.query(`
      INSERT INTO delivery_agents (name, phone, password, is_online, shift_preference, is_verified, verification_status, delivery_partner_status, latitude, longitude)
      VALUES ('Active Agent Test', '9999999991', 'dummy', TRUE, 'Morning (07:00 AM - 01:00 PM)', TRUE, 'Approved', 'ACTIVE', 22.5860, 88.4210)
      ON CONFLICT (phone) DO UPDATE 
      SET is_online = TRUE, delivery_partner_status = 'ACTIVE'
      RETURNING id, phone, name
    `);
    const activeAgent = activeAgentRes.rows[0];
    console.log(`✅ Dummy Active Agent ID: ${activeAgent.id}, Phone: ${activeAgent.phone}`);

    // 3. Register a test user (buyer) if not exists to associate orders
    const buyerRes = await db.query("SELECT id FROM users LIMIT 1");
    if (buyerRes.rows.length === 0) {
      console.log("❌ No user exists in database to associate with dummy order. Create a user first.");
      process.exit(1);
    }
    const buyerId = buyerRes.rows[0].id;

    // 4. Create dummy orders assigned to blocked agent
    console.log("📦 Creating dummy active orders for blocked agent...");
    const order1 = await db.query(`
      INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price, order_status, delivery_boy_phone, delivery_boy_name)
      VALUES ($1, 1200.00, 50.00, 40.00, 'Out for Delivery', $2, $3)
      RETURNING id
    `, [buyerId, blockedAgent.phone, blockedAgent.name]);

    const order2 = await db.query(`
      INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price, order_status, delivery_boy_phone, delivery_boy_name)
      VALUES ($1, 800.00, 30.00, 20.00, 'Exchange Out for Delivery', $2, $3)
      RETURNING id
    `, [buyerId, blockedAgent.phone, blockedAgent.name]);

    const o1Id = order1.rows[0].id;
    const o2Id = order2.rows[0].id;

    // 5. Create shipping info for these orders to mock destinations (e.g., Kolkata destination)
    await db.query(`
      INSERT INTO shipping_info (order_id, full_name, state, city, country, address, pincode, phone)
      VALUES ($1, 'Customer Test 1', 'West Bengal', 'Kolkata', 'India', 'Salt Lake Sec V', '700091', '9876543212')
      ON CONFLICT (order_id) DO NOTHING
    `, [o1Id]);
    await db.query(`
      INSERT INTO shipping_info (order_id, full_name, state, city, country, address, pincode, phone)
      VALUES ($1, 'Customer Test 2', 'West Bengal', 'Kolkata', 'India', 'Salt Lake Sec II', '700091', '9876543213')
      ON CONFLICT (order_id) DO NOTHING
    `, [o2Id]);

    console.log(`✅ Created Order 1 ID: ${o1Id}`);
    console.log(`✅ Created Order 2 ID: ${o2Id}`);

    // 6. Execute the auto block & reassignment logic directly (to test query accuracy)
    console.log("⚡ Executing Auto-Block database transaction...");
    await db.query("BEGIN");
    
    // Block agent, add fine, set offline
    await db.query(`
      UPDATE delivery_agents 
      SET delivery_partner_status = 'BLOCKED',
          fine_amount = fine_amount + 300,
          block_reason = 'Offline During Active Shift',
          blocked_at = CURRENT_TIMESTAMP,
          is_online = FALSE
      WHERE id = $1
    `, [blockedAgent.id]);

    // Insert to fines table
    await db.query(`
      INSERT INTO fines (partner_id, amount, reason, status)
      VALUES ($1, 300, 'Offline During Active Shift', 'Pending')
    `, [blockedAgent.id]);

    // Log block event
    await db.query(`
      INSERT INTO delivery_agent_offline_logs (partner_id, event_type, offline_count, details)
      VALUES ($1, 'Auto Blocked', 5, 'Blocked due to Offline count limit reached.')
    `, [blockedAgent.id]);

    await db.query("COMMIT");
    console.log("✅ Auto-block transaction committed successfully.");

    // Check blocked partner fine amount
    const blockCheck = await db.query(`SELECT fine_amount, delivery_partner_status FROM delivery_agents WHERE id = $1`, [blockedAgent.id]);
    console.log(`   Agent Compliance Status: ${blockCheck.rows[0].delivery_partner_status}`);
    console.log(`   Agent Fine balance: ₹${blockCheck.rows[0].fine_amount}`);

    // 7. Execute order reassignment engine logic
    console.log("⚡ Executing Order Reassignment Engine...");
    
    // Fetch active orders assigned to blocked agent's phone
    const activeOrdersRes = await db.query(
      `SELECT o.id, s.city, s.address, s.state, s.pincode
       FROM orders o
       LEFT JOIN shipping_info s ON o.id = s.order_id
       WHERE o.delivery_boy_phone = $1 AND o.order_status IN ('Processing', 'Order Packed', 'Shipped', 'Out for Delivery', 'Exchange Out for Delivery')`,
      [blockedAgent.phone]
    );

    console.log(`   Found ${activeOrdersRes.rows.length} active orders to reassign.`);

    // Fetch eligible online agents
    const eligibleAgentsRes = await db.query(
      `SELECT id, name, phone, vehicle_number, avatar_url, latitude, longitude
       FROM delivery_agents
       WHERE is_online = TRUE AND is_verified = TRUE AND verification_status = 'Approved' AND (delivery_partner_status = 'ACTIVE' OR delivery_partner_status IS NULL)`
    );
    const eligibleAgents = eligibleAgentsRes.rows;
    console.log(`   Found ${eligibleAgents.length} online eligible agents.`);

    const getCoords = (city, address, state, pincode) => {
      return { latitude: 22.5850, longitude: 88.4200 }; // mock coords
    };
    const getDistance = (lat1, lon1, lat2, lon2) => {
      return Math.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2);
    };

    for (const order of activeOrdersRes.rows) {
      let bestAgent = null;
      let minDistance = Infinity;
      const orderCoords = getCoords(order.city, order.address, order.state, order.pincode);

      for (const agent of eligibleAgents) {
        if (agent.latitude && agent.longitude) {
          const dist = getDistance(agent.latitude, agent.longitude, orderCoords.latitude, orderCoords.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            bestAgent = agent;
          }
        }
      }

      if (bestAgent) {
        console.log(`   👉 Reassigning Order ${order.id} to ${bestAgent.name} (phone: ${bestAgent.phone})`);
        await db.query(
          `UPDATE orders 
           SET delivery_boy_phone = $1,
               delivery_boy_name = $2,
               delivery_boy_vehicle = $3,
               delivery_boy_photo = $4
           WHERE id = $5`,
          [bestAgent.phone, bestAgent.name, bestAgent.vehicle_number, bestAgent.avatar_url, order.id]
        );
      }
    }

    // 8. Verify the order has been reassigned to the active agent
    console.log("🔍 Verifying reassignment output...");
    const verifyO1 = await db.query(`SELECT delivery_boy_phone, delivery_boy_name FROM orders WHERE id = $1`, [o1Id]);
    console.log(`   Order 1 now assigned to: ${verifyO1.rows[0].delivery_boy_name} (${verifyO1.rows[0].delivery_boy_phone})`);
    
    if (verifyO1.rows[0].delivery_boy_phone === activeAgent.phone) {
      console.log("🎉 SUCCESS: Order correctly reassigned to the nearest online delivery boy!");
    } else {
      console.error("❌ FAILED: Reassignment target did not match.");
    }

    // Cleanup test data
    console.log("🧹 Cleaning up dummy test data...");
    await db.query("DELETE FROM orders WHERE id IN ($1, $2)", [o1Id, o2Id]);
    await db.query("DELETE FROM fines WHERE partner_id = $1", [blockedAgent.id]);
    await db.query("DELETE FROM delivery_agent_offline_logs WHERE partner_id = $1", [blockedAgent.id]);
    await db.query("DELETE FROM delivery_agents WHERE id IN ($1, $2)", [blockedAgent.id, activeAgent.id]);
    console.log("✅ Cleanup complete.");

  } catch (error) {
    console.error("❌ Test error:", error.message);
  } finally {
    await db.end();
  }
}

runTest();
