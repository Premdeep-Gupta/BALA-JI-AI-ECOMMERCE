import database from "./database/db.js";

async function main() {
  try {
    console.log("🧹 Running cleanup script for single-image mobile products...");
    
    const countBefore = await database.query("SELECT COUNT(*) FROM products WHERE category = 'Mobiles'");
    
    // Delete query: delete mobiles with only 1 image or those that don't have scraped images from Flipkart
    const deleteRes = await database.query(`
      DELETE FROM products 
      WHERE category = 'Mobiles' 
        AND (
          jsonb_array_length(images) <= 1 
          OR images::text NOT LIKE '%rukminim1.flixcart.com%'
        )
    `);
    
    const countAfter = await database.query("SELECT COUNT(*) FROM products WHERE category = 'Mobiles'");
    
    console.log(`🗑️ Removed ${deleteRes.rowCount} single-image mobile products.`);
    console.log(`📊 Mobile products remaining in DB: ${countAfter.rows[0].count}`);
    
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
