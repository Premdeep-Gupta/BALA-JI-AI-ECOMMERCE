import database from "./db.js";

async function alterTable() {
  try {
    await database.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6),
      ADD COLUMN IF NOT EXISTS reset_otp_expire TIMESTAMP;
    `);
    console.log("Successfully altered users table to add OTP fields!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to alter users table:", error);
    process.exit(1);
  }
}

alterTable();
