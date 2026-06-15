import database from "./database/db.js";

async function run() {
  try {
    const res = await database.query("SELECT id, title, start_date, end_date, is_approved, is_active FROM sales_campaigns");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
