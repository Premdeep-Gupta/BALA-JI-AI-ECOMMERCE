import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local env config
dotenv.config({ path: path.join(__dirname, "config", "config.env") });

const { Pool } = pg;

// Connection to Local Database
const localPool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: String(process.env.PG_PASSWORD),
  port: Number(process.env.PG_PORT),
});

// Connection to Cloud Database
const cloudPool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_p7Ns1jQYoWuK@ep-snowy-fire-ao1ugtib.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

const ADMIN_ID = "50841e0e-21df-475a-b822-8d007ac57349"; // Kumar Gupta's Admin ID in Cloud DB

async function sync() {
  try {
    console.log("🔌 Connecting to Local and Cloud databases...");
    await localPool.query("SELECT NOW()");
    await cloudPool.query("SELECT NOW()");
    console.log("✅ Databases Connected.");

    // Fetch all products from Local DB
    console.log("📥 Fetching products from local database...");
    const localRes = await localPool.query("SELECT * FROM products");
    const localProducts = localRes.rows;
    console.log(`📦 Loaded ${localProducts.length} products from local database.`);

    if (localProducts.length === 0) {
      console.warn("⚠️ No products found in local database to sync.");
      return;
    }

    // Clear existing products in Cloud DB
    console.log("🧹 Clearing products table in Cloud database...");
    await cloudPool.query("DELETE FROM products");
    console.log("✅ Cloud products table cleared.");

    // Insert products into Cloud DB
    console.log("📤 Inserting products into Cloud database...");
    let inserted = 0;

    for (const prod of localProducts) {
      // We map the created_by field to our active admin in cloud database
      const createdBy = ADMIN_ID;

      // Handle column values
      const query = `
        INSERT INTO products (
          name, description, price, category, stock, ratings, images, 
          created_by, original_price, discount_percentage, offer_type, 
          embedding, sub_category, video, item_link
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;

      const values = [
        prod.name,
        prod.description,
        prod.price,
        prod.category,
        prod.stock,
        prod.ratings,
        typeof prod.images === 'string' ? prod.images : JSON.stringify(prod.images || []),
        createdBy,
        prod.original_price,
        prod.discount_percentage,
        prod.offer_type,
        prod.embedding,
        prod.sub_category,
        typeof prod.video === 'string' ? prod.video : JSON.stringify(prod.video || null),
        prod.item_link
      ];

      await cloudPool.query(query, values);
      inserted++;

      if (inserted % 500 === 0) {
        console.log(`  ▓ Progress: Synced ${inserted} / ${localProducts.length} products...`);
      }
    }

    console.log(`\n🎉 Synchronization Complete! Synced ${inserted} products to Cloud DB successfully.`);

  } catch (error) {
    console.error("❌ Synchronization failed:", error);
  } finally {
    await localPool.end();
    await cloudPool.end();
    console.log("🔌 Database connections closed.");
  }
}

sync();
