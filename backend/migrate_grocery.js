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

async function migrateGrocery() {
  try {
    console.log("🔌 Connecting to Database...");
    
    // Perform update query
    console.log("🚚 Migrating grocery products from 'Home' to 'Balaji Grocery'...");
    const res = await db.query(
      `UPDATE products 
       SET category = 'Balaji Grocery' 
       WHERE category = 'Home' 
         AND images::text LIKE '%bigbasket%'`
    );
    
    console.log(`\n✅ Migration Complete!`);
    console.log(`   - Successfully migrated ${res.rowCount} products to 'Balaji Grocery'.`);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await db.end();
    console.log("🔌 Connection closed.");
  }
}

migrateGrocery();
