import database from "../database/db.js";

export const createUserAddressesTable = async () => {
  await database.query(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id            SERIAL PRIMARY KEY,
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name     VARCHAR(255) NOT NULL,
      phone         VARCHAR(20) NOT NULL,
      alt_phone     VARCHAR(20),
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      landmark      TEXT,
      city          VARCHAR(100) NOT NULL,
      state         VARCHAR(100) NOT NULL,
      country       VARCHAR(100) DEFAULT 'India',
      pincode       VARCHAR(20) NOT NULL,
      address_type  VARCHAR(50) DEFAULT 'Home',
      instructions  TEXT,
      is_default    BOOLEAN DEFAULT false,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("user_addresses table ready.");
};
