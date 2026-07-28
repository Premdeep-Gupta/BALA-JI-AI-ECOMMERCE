import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { parseSearchQuery } from "./utils/aiHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "config", "config.env") });

const { Pool } = pg;
const db = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: String(process.env.PG_PASSWORD),
  port: Number(process.env.PG_PORT),
});

async function run() {
  try {
    const testQuery = "bacchon ko khilane wala";
    console.log(`🔍 Testing Query Parser for: "${testQuery}"`);
    const parsed = await parseSearchQuery(testQuery);
    console.log("Parsed result:", parsed);

    const conditions = [];
    const values = [];
    let index = 1;

    if (parsed.category) {
      conditions.push(`p.category = $${index}`);
      values.push(parsed.category);
      index++;
    }

    let relevanceSelect = "";
    if (parsed.keywords.length > 0) {
      const keywordConditions = [];
      const scores = [];
      parsed.keywords.forEach(kw => {
        keywordConditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
        values.push(`%${kw}%`);
        index++;

        scores.push(`(CASE WHEN p.name ILIKE $${index} THEN 10 ELSE 0 END)`);
        values.push(`%${kw}%`);
        index++;
        scores.push(`(CASE WHEN p.description ILIKE $${index} THEN 2 ELSE 0 END)`);
        values.push(`%${kw}%`);
        index++;
      });
      conditions.push(`(${keywordConditions.join(" OR ")})`);
      relevanceSelect = `, (${scores.join(" + ")}) as relevance_score`;
    } else {
      relevanceSelect = `, 0 as relevance_score`;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const queryStr = `
      SELECT p.name, p.category, p.price ${relevanceSelect}
      FROM products p
      ${whereClause}
      ORDER BY relevance_score DESC, p.created_at DESC
      LIMIT 10
    `;

    console.log("\n⚡ Executing Database Query...");
    const res = await db.query(queryStr, values);
    
    console.log("\n📦 Search Results (Ranked):");
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Test error:", err.message);
  } finally {
    await db.end();
  }
}

run();
