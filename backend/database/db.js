import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "./config/config.env" });

const { Pool } = pg;

const database = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: String(process.env.PG_PASSWORD),
      port: Number(process.env.PG_PORT),
    });

database.connect((err) => {
  if (err) {
    console.log("❌ PostgreSQL Connection Error");
    console.log(err.message);
  } else {
    console.log("✅ PostgreSQL Connected Successfully");
  }
});

export default database;