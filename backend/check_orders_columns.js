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

async function checkColumns() {
  try {
    console.log("🔌 Connecting to DB to inspect schemas...");
    const resOrders = await db.query(
      `SELECT column_name, data_type, character_maximum_length 
       FROM information_schema.columns 
       WHERE table_name = 'orders'`
    );
    console.log("\n📊 Orders Columns:");
    console.table(resOrders.rows);

    const resPayments = await db.query(
      `SELECT column_name, data_type, character_maximum_length 
       FROM information_schema.columns 
       WHERE table_name = 'payments'`
    );
    console.log("\n📊 Payments Columns:");
    console.table(resPayments.rows);
  } catch (err) {
    console.error("❌ Error checking columns:", err.message);
  } finally {
    await db.end();
  }
}

checkColumns();
