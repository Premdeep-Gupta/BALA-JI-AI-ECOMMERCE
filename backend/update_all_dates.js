import database from "./database/db.js";

async function run() {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const result = await database.query(`
      UPDATE sales_campaigns 
      SET start_date = $1, end_date = $2,
          is_active = CASE WHEN is_approved = true THEN true ELSE false END
      RETURNING id, title, start_date, end_date, is_approved, is_active
    `, [yesterday, nextWeek]);

    console.log("✅ Successfully updated all campaigns in the database:");
    console.log(JSON.stringify(result.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Database update error:", err);
    process.exit(1);
  }
}
run();
