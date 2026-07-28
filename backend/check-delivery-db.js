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

async function main() {
  try {
    console.log("🔌 Connecting to DB...");
    const res = await db.query("SELECT id, name, phone, vehicle_number, documents FROM delivery_partners LIMIT 5");
    console.log("Delivery Partners in DB:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("❌ Error checking DB:", err.message);
  } finally {
    await db.end();
  }
}

main();
