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
const CSV_FILE_PATH = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/Create_products2.csv";

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

    const headers = parsed[0].map(h => h.trim());
    const rawProducts = parsed.slice(1);
    console.log(`📦 Loaded ${rawProducts.length} rows from CSV file.`);

    const titleColIdx = headers.indexOf("Product Title");
    const descColIdx = headers.indexOf("Product Description");
    const categoryColIdx = headers.indexOf("Bb Category");
    const mrpColIdx = headers.indexOf("Mrp");
    const priceColIdx = headers.indexOf("Price");
    const imageColIdx = headers.indexOf("Image Url");
    const uniqIdColIdx = headers.indexOf("Uniq Id");

    if (titleColIdx === -1 || priceColIdx === -1 || categoryColIdx === -1 || imageColIdx === -1) {
      console.error("❌ Missing required headers in CSV.");
      return;
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (let idx = 0; idx < rawProducts.length; idx++) {
      const row = rawProducts[idx];
      if (row.length < Math.max(titleColIdx, categoryColIdx, priceColIdx, imageColIdx)) {
        skippedCount++;
        continue;
      }

      const productName = (row[titleColIdx] || "").trim();
      const rawPrice = (row[priceColIdx] || "").trim();
      const rawCategory = (row[categoryColIdx] || "").trim();
      const rawMainImage = (row[imageColIdx] || "").trim();
      const rawDesc = (row[descColIdx] || "Premium quality imported product.").trim();
      const rawMrp = (row[mrpColIdx] || "").trim();
      const sku = (row[uniqIdColIdx] || `bb_${idx}`).trim();

      if (!productName || !rawPrice || !rawCategory || !rawMainImage) {
        skippedCount++;
        continue;
      }

      // 1. Map BigBasket Categories to strict DB Categories
      let dbCategory = "";
      const csvCategory = rawCategory.trim();

      if (
        csvCategory.includes("Beauty") ||
        csvCategory.includes("Fragrances") ||
        csvCategory.includes("Personal Care") ||
        csvCategory.includes("Skin Care") ||
        csvCategory.includes("Hair Care") ||
        csvCategory.includes("Makeup") ||
        csvCategory.includes("Deos") ||
        csvCategory.includes("Shaving") ||
        csvCategory.includes("Soaps & Body Wash")
      ) {
        dbCategory = "Beauty";
      } else if (
        csvCategory.includes("Baby") ||
        csvCategory.includes("Kids") ||
        csvCategory.includes("Dairy") ||
        csvCategory.includes("Bakery") ||
        csvCategory.includes("Diapers")
      ) {
        dbCategory = "Kids & Baby";
      } else if (
        csvCategory.includes("Home") ||
        csvCategory.includes("Kitchen") ||
        csvCategory.includes("Cleaners") ||
        csvCategory.includes("Household") ||
        csvCategory.includes("Juices") ||
        csvCategory.includes("Chocolates") ||
        csvCategory.includes("Drinks") ||
        csvCategory.includes("Masalas") ||
        csvCategory.includes("Spices") ||
        csvCategory.includes("Atta") ||
        csvCategory.includes("Flours") ||
        csvCategory.includes("Baking") ||
        csvCategory.includes("Cook") ||
        csvCategory.includes("Food") ||
        csvCategory.includes("Sauces") ||
        csvCategory.includes("Vinegar") ||
        csvCategory.includes("Beverages") ||
        csvCategory.includes("Groceries") ||
        csvCategory.includes("Snacks") ||
        csvCategory.includes("Biscuits") ||
        csvCategory.includes("Ghee") ||
        csvCategory.includes("Oils") ||
        csvCategory.includes("Dals") ||
        csvCategory.includes("Pulses") ||
        csvCategory.includes("Rice") ||
        csvCategory.includes("Pantry") ||
        csvCategory.includes("Pharma") ||
        csvCategory.includes("Pooja") ||
        csvCategory.includes("Paper & Disposables")
      ) {
        dbCategory = "Balaji Grocery";
      } else if (csvCategory.includes("Electronics") || csvCategory.includes("Appliances")) {
        dbCategory = "Electronics";
      } else if (csvCategory.includes("Clothing") || csvCategory.includes("Apparel") || csvCategory.includes("Fashion")) {
        dbCategory = "Fashion";
      } else {
        // Fallback default
        dbCategory = "Balaji Grocery";
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

      // 3. Keep standard INR Prices
      const cleanPrice = rawPrice.replace(/[^0-9.]/g, '');
      const cleanMrp = rawMrp.replace(/[^0-9.]/g, '');
      
      const price = Math.round(parseFloat(cleanPrice));
      const originalPrice = cleanMrp ? Math.round(parseFloat(cleanMrp)) : Math.round(price * 1.2);

      if (isNaN(price) || price <= 0 || isNaN(originalPrice) || originalPrice <= 0) {
        skippedCount++;
        continue;
      }

      const discountPercentage = Math.max(
        0,
        Math.min(99, Math.floor(((originalPrice - price) / originalPrice) * 100))
      );

      // 4. Clean and parse pipe-separated Image URLs
      const imgUrls = rawMainImage.split("|").map(url => url.replace(/^"|"$/g, "").trim()).filter(Boolean);
      const imagesArray = imgUrls.map((url, i) => ({
        url: url,
        public_id: `bigbasket/${sku}_${i}`
      }));

      if (imagesArray.length === 0) {
        skippedCount++;
        continue;
      }

      // 5. Stock and Ratings
      const ratings = 4.3; // Default stable rating for bigbasket items
      const stock = Math.floor(Math.random() * 60) + 50; // Random stock between 50 and 110
      
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
          rawDesc,
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
