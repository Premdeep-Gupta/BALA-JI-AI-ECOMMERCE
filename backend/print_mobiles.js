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

async function printMobiles() {
  try {
    const res = await db.query("SELECT id, name, category, sub_category, price FROM products WHERE category = 'Mobiles' AND (name ILIKE '%iphone%' OR sub_category ILIKE '%iphone%') LIMIT 15");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

printMobiles();
