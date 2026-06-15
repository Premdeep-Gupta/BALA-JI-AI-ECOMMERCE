import database from "../database/db.js";

export async function createSupportChatsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS support_chats (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'admin')),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await database.query(query);

    // Safety migration for attachments
    await database.query(`ALTER TABLE support_chats ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);`);

    console.log("✅ support_chats Table Created/Verified Successfully.");
  } catch (error) {
    console.error("❌ Failed To Create support_chats Table.", error);
    process.exit(1);
  }
}
