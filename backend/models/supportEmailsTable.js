import database from "../database/db.js";

export async function createSupportEmailsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS support_emails (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        folder VARCHAR(10) NOT NULL CHECK (folder IN ('inbox', 'sent', 'trash')),
        sender_name VARCHAR(100) NOT NULL,
        sender_email VARCHAR(100) NOT NULL,
        recipient_email VARCHAR(100),
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        starred BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        ticket_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await database.query(query);

    // Safety Migrations for existing databases
    await database.query(`ALTER TABLE support_emails ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed'));`);
    await database.query(`ALTER TABLE support_emails ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));`);
    await database.query(`ALTER TABLE support_emails ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(50);`);

    console.log("✅ support_emails Table Created/Verified/Updated Successfully.");
  } catch (error) {
    console.error("❌ Failed To Create/Update support_emails Table.", error);
    process.exit(1);
  }
}
