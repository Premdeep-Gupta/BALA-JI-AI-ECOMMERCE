import database from "../database/db.js";

export async function createSalesCampaignsTable() {
  try {
    const query = `
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
        ai_image_url TEXT,
        banner_image TEXT,
        media_assets JSONB DEFAULT '[]',
        category VARCHAR(255) DEFAULT 'All Categories',
        design_theme VARCHAR(100) DEFAULT 'luxury',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await database.query(query);

    // ALTER TABLE to add any missing columns for already-existing tables on Render/Supabase
    await database.query(`
      ALTER TABLE sales_campaigns
      ADD COLUMN IF NOT EXISTS ai_image_url TEXT,
      ADD COLUMN IF NOT EXISTS banner_image TEXT,
      ADD COLUMN IF NOT EXISTS media_assets JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'All Categories',
      ADD COLUMN IF NOT EXISTS design_theme VARCHAR(100) DEFAULT 'luxury',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log("✅ Sales Campaigns Table Created/Verified Successfully");
  } catch (error) {
    console.error("❌ Failed To Create Sales Campaigns Table.", error);
    process.exit(1);
  }
}
