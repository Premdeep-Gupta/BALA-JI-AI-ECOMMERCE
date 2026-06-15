import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "./config/config.env" });

const { Pool } = pg;
const database = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: String(process.env.PG_PASSWORD),
  port: Number(process.env.PG_PORT),
});

async function migrate() {
  try {
    console.log("Starting Step 1 Database Migration (PostgreSQL)...");

    // 1. Alter products table to add discount_percentage if not exists
    await database.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 15;
    `);
    console.log("✅ Verified product.discount_percentage column.");

    // 2. Set random discount percentages for existing products to make discounts dynamic & attractive (e.g. 10% to 70%)
    await database.query(`
      UPDATE products 
      SET discount_percentage = floor(random() * (70 - 10 + 1) + 10)::integer 
      WHERE discount_percentage = 15;
    `);
    console.log("✅ Seeded random attractive discount percentages for existing products.");

    // 3. Create sales_campaigns table
    await database.query(`
      CREATE TABLE IF NOT EXISTS sales_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        banner_text TEXT NOT NULL,
        tagline VARCHAR(255) NOT NULL,
        discount_label VARCHAR(100) NOT NULL,
        cta_button_text VARCHAR(100) NOT NULL DEFAULT 'Explore Now',
        theme_colors JSONB NOT NULL,
        discount_percentage INTEGER NOT NULL DEFAULT 15,
        event_name VARCHAR(255) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        is_ai_generated BOOLEAN DEFAULT TRUE,
        is_approved BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT FALSE,
        product_ids UUID[] DEFAULT '{}',
        seo_title VARCHAR(255),
        seo_description TEXT,
        push_notification_text TEXT,
        email_text TEXT,
        social_media_caption TEXT,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Verified sales_campaigns table.");

    // 4. Create browsing_history table
    await database.query(`
      CREATE TABLE IF NOT EXISTS browsing_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_id VARCHAR(255) NOT NULL,
        product_id UUID NOT NULL,
        category VARCHAR(100) NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bh_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Verified browsing_history table.");

    console.log("🎉 Database Migration Completed Successfully!");
  } catch (err) {
    console.error("❌ Database Migration Failed:", err);
  } finally {
    await database.end();
  }
}

migrate();
