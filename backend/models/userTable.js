import database from "../database/db.js";

export async function createUserTable() {
  try {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 3),
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(10) DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
            avatar JSONB DEFAULT NULL,
            phone VARCHAR(20) DEFAULT NULL,
            reset_password_token TEXT DEFAULT NULL,
            reset_password_expire TIMESTAMP DEFAULT NULL,
            reset_otp VARCHAR(6) DEFAULT NULL,
            reset_otp_expire TIMESTAMP DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await database.query(query);
    await database.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6),
      ADD COLUMN IF NOT EXISTS reset_otp_expire TIMESTAMP,
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;
    `);
  } catch (error) {
    console.error("❌ Failed To Create Users Table.", error);
    process.exit(1);
  }
}
