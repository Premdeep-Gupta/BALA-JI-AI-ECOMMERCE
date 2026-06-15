import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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

const ADMIN_ID = "bc6596bb-b7bf-404d-b2c3-9ef25f970777";
const CSV_FILE_PATH = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/Create_products .csv";

// Robust state-machine CSV parser
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 1 || currentRow[0] !== '') {
          rows.push(currentRow);
        }
        currentRow = [];
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
  }

  if (currentRow.length > 0 || currentField !== '') {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

async function seedCSVProducts() {
  try {
    console.log("🔌 Connecting to database...");
    console.log("📂 Reading and parsing CSV file from:", CSV_FILE_PATH);
    
    const parsed = parseCSV(CSV_FILE_PATH);
    if (parsed.length <= 1) {
      console.error("❌ CSV file is empty or missing content.");
      return;
    }

    const headers = parsed[0];
    const rawProducts = parsed.slice(1);
    console.log(`📦 Loaded ${rawProducts.length} rows from CSV file.`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (let idx = 0; idx < rawProducts.length; idx++) {
      const row = rawProducts[idx];
      if (row.length !== headers.length) {
        skippedCount++;
        continue;
      }

      // Map row to headers
      const rawProduct = {};
      headers.forEach((h, i) => {
        rawProduct[h] = row[i];
      });

      const productName = (rawProduct.product_name || rawProduct.name || "").trim();
      const rawPrice = rawProduct.final_price || rawProduct.price;
      const rawCategory = rawProduct.root_category_name || rawProduct.category;
      const rawMainImage = rawProduct.main_image || rawProduct.image;
      const sku = rawProduct.sku || `wal_${idx}`;

      if (!productName || !rawPrice || !rawCategory || !rawMainImage) {
        skippedCount++;
        continue;
      }

      // 1. Map CSV categories to our strict DB categories
      let dbCategory = "";
      const csvCategory = rawCategory.trim();

      if (csvCategory === "Clothing" || csvCategory === "Jewelry") {
        dbCategory = "Fashion";
      } else if (csvCategory === "Home" || csvCategory === "Home Improvement") {
        dbCategory = "Home";
      } else if (csvCategory === "Beauty" || csvCategory === "Premium Beauty") {
        dbCategory = "Beauty";
      } else if (csvCategory === "Baby" || csvCategory === "Toys") {
        dbCategory = "Kids & Baby";
      } else if (csvCategory === "Sports & Outdoors") {
        dbCategory = "Sports";
      } else if (csvCategory === "Auto & Tires") {
        dbCategory = "Automotive";
      } else if (csvCategory === "Electronics") {
        dbCategory = "Electronics";
      } else {
        // Skip uncategorized items to keep DB clean
        skippedCount++;
        continue;
      }

      // 2. Prevent duplicate products
      const existCheck = await db.query(
        "SELECT id FROM products WHERE name = $1 LIMIT 1",
        [productName]
      );
      if (existCheck.rows.length > 0) {
        skippedCount++;
        continue;
      }

      // 3. Convert USD Price to INR (Multiplied by 83)
      const price = Math.round(Number(rawPrice) * 83);
      const originalPrice = rawProduct.initial_price
        ? Math.round(Number(rawProduct.initial_price) * 83)
        : Math.round(price * 1.3);

      const discountPercentage = Math.max(
        0,
        Math.min(99, Math.floor(((originalPrice - price) / originalPrice) * 100))
      );

      // 4. Clean and parse Image URLs (Removes extra outer double quotes from CSV parse)
      const mainImgUrl = rawMainImage.replace(/^"|"$/g, "").trim();
      let imagesArray = [{ url: mainImgUrl, public_id: `walmart/${sku}_main` }];

      try {
        if (rawProduct.image_urls) {
          const rawUrls = JSON.parse(rawProduct.image_urls);
          if (Array.isArray(rawUrls) && rawUrls.length > 0) {
            imagesArray = rawUrls.map((url, i) => ({
              url: url.replace(/^"|"$/g, "").trim(),
              public_id: `walmart/${sku}_${i}`
            }));
          }
        }
      } catch (e) {
        // Safe fallback to mainImgUrl
      }

      // 5. Ratings & Description
      const ratings = isNaN(Number(rawProduct.rating)) ? 4.5 : Number(rawProduct.rating);
      const description = (rawProduct.description || "Premium quality imported product.").trim();
      const stock = Math.floor(Math.random() * 80) + 40; // Random stock between 40 and 120
      
      const offerTypes = ["HOTDEAL", "BESTSELLER", "NEW"];
      const offerType = offerTypes[idx % offerTypes.length];

      // 6. DB Insertion
      await db.query(
        `INSERT INTO products (
          name, description, price, category, stock, ratings, images, 
          created_by, original_price, discount_percentage, offer_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)`,
        [
          productName,
          description,
          price,
          dbCategory,
          stock,
          ratings,
          JSON.stringify(imagesArray),
          ADMIN_ID,
          originalPrice,
          discountPercentage,
          offerType
        ]
      );

      insertedCount++;
      if (insertedCount % 50 === 0) {
        console.log(`  ▓ Progress: Imported ${insertedCount} products...`);
      }
    }

    console.log("\n📊 Seeding Complete Summary:");
    console.log(`   - Successfully Imported: ${insertedCount} products`);
    console.log(`   - Skipped/Duplicates: ${skippedCount} products`);

  } catch (error) {
    console.error("❌ Database seeding failed:", error.message);
  } finally {
    await db.end();
    console.log("🔌 Database connection closed.");
  }
}

seedCSVProducts();
