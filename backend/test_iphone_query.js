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
  try {
    // Simulate req.query values
    const category = "Mobiles";
    const sub_category = "iphone";
    
    const conditions = [];
    const values = [];
    let index = 1;
    
    if (category) {
      conditions.push(`p.category ILIKE $${index}`);
      values.push(`%${category}%`);
      index++;
    }
    
    // Sibling brand / subcategory mapping logic from controller
    const isMobileCat = category && (category.toLowerCase() === "mobiles" || category.toLowerCase().includes("mobile"));
    if (isMobileCat) {
      if (sub_category) {
        conditions.push(`p.sub_category ILIKE $${index}`);
        values.push(`%${sub_category}%`);
        index++;
      }
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT COUNT(*) FROM products p ${whereClause}`;
    console.log("SQL Query:", query);
    console.log("SQL Values:", values);
    
    const resAllIphones = await db.query("SELECT COUNT(*) FROM products WHERE name ILIKE '%iphone%'");
    console.log("Total iPhones in products table (by name):", resAllIphones.rows[0].count);

    const resMobilesIphones = await db.query("SELECT COUNT(*) FROM products WHERE category = 'Mobiles' AND sub_category = 'IPHONE'");
    console.log("Total products with category='Mobiles' and sub_category='IPHONE':", resMobilesIphones.rows[0].count);

    const resTotalMobiles = await db.query("SELECT COUNT(*) FROM products WHERE category = 'Mobiles'");
    console.log("Total Mobiles in DB:", resTotalMobiles.rows[0].count);

    const subCatsCount = await db.query("SELECT sub_category, COUNT(*) FROM products WHERE category = 'Mobiles' GROUP BY sub_category");
    console.log("Mobiles subcategory distribution:", subCatsCount.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

runTest();
