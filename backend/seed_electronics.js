import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import readline from "readline";
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
const CSV_FILE_PATH = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/Electronics_ product.csv";

// Simple CSV parser for a single line
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

// Function to check if image is valid, high quality, and not a placeholder
function isValidImage(url) {
  if (!url) return false;
  const u = url.toLowerCase().trim();
  
  // Must be a valid HTTP/HTTPS link
  if (!u.startsWith("http://") && !u.startsWith("https://")) return false;
  
  // Exclude placeholders / sorry / not available
  if (u.includes("sorry") || 
      u.includes("placeholder") || 
      u.includes("not_available") || 
      u.includes("notavailable") || 
      u.includes("no-image") || 
      u.includes("noimage") ||
      u.includes("pixel.gif") ||
      u.includes("clear.gif") ||
      u.includes("sprite")) {
    return false;
  }
  
  // Exclude tiny thumbnails and low quality images (e.g. s-l64.jpg, s-l96.jpg, etc.)
  if (u.includes("/thumbnails/") || 
      u.includes("/smallimages/") ||
      u.includes("s-l64") || 
      u.includes("s-l96") || 
      u.includes("s-l140") || 
      u.includes("s-l200") || 
      u.includes("s-l225") || 
      u.includes("s-l250") || 
      u.includes("s-l300")) {
    return false;
  }
  
  return true;
}

// Score function to prioritize working/non-blocking domains
function scoreImageURL(url) {
  const u = url.toLowerCase();
  if (u.includes("amazon.com") || u.includes("ssl-images-amazon.com") || u.includes("media-amazon.com")) {
    return 10; // Highest priority (Amazon never blocks hotlinks)
  }
  if (u.includes("bhphoto.com")) {
    return 8; // High priority (B&H Photo never blocks hotlinks)
  }
  if (u.includes("bestbuy.com") || u.includes("bbystatic.com")) {
    return 4; // Medium priority
  }
  if (u.includes("walmartimages.com")) {
    return 2; // Low priority (often blocks hotlinks)
  }
  return 0; // Default
}

async function seedElectronics() {
  try {
    console.log("🔌 Connecting to Database...");
    
    // 0. Clean previously imported Electronics & Mobiles products
    console.log("🧹 Clearing previously imported Electronics & Mobiles products...");
    const deleteRes = await db.query(
      "DELETE FROM products WHERE category = 'Electronics' OR category = 'Mobiles'"
    );
    console.log(`🗑️ Removed ${deleteRes.rowCount} pre-existing items.`);

    console.log("📂 Reading Electronics CSV from:", CSV_FILE_PATH);
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error("❌ Electronics CSV file not found at path!");
      return;
    }

    const fileStream = fs.createReadStream(CSV_FILE_PATH);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let totalLines = 0;
    let headers = null;
    let insertedCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;
    let badImageCount = 0;

    for await (const line of rl) {
      totalLines++;
      if (totalLines === 1) {
        headers = parseCSVLine(line).map(h => h.trim());
        console.log("📌 Headers found:", headers);
        continue;
      }

      const parsed = parseCSVLine(line);
      if (parsed.length < headers.length) {
        skippedCount++;
        continue;
      }

      // Map line data to headers
      const row = {};
      headers.forEach((h, i) => {
        row[h] = parsed[i];
      });

      const productName = (row.name || "").trim();
      const brand = (row.brand || "").trim();
      const categories = (row.categories || "").trim();
      const rawPrice = row["prices.amountMin"] || row["prices.amountMax"] || "";
      const rawImageURLs = row.imageURLs || "";
      const weight = (row.weight || "").trim();
      const manufacturer = (row.manufacturer || "").trim();
      const id = row.id || `elec_${totalLines}`;

      if (!productName || !rawPrice || !categories) {
        skippedCount++;
        continue;
      }

      // 1. Image URLs parsing and validation
      const rawUrls = rawImageURLs.split(",").map(url => url.replace(/^"|"$/g, "").trim()).filter(Boolean);
      const validUrls = rawUrls.filter(isValidImage);
      
      // If there are no valid/clear images, skip this product
      if (validUrls.length === 0) {
        badImageCount++;
        continue;
      }

      // Prioritize working domains (Amazon, B&H Photo) over domains that block hotlinks (Walmart)
      validUrls.sort((a, b) => scoreImageURL(b) - scoreImageURL(a));

      const imagesArray = validUrls.slice(0, 5).map((url, i) => ({
        url: url,
        public_id: `electronics/${id}_${i}`
      }));

      // 2. Classification Mappings
      const categoriesLower = categories.toLowerCase();
      const nameLower = productName.toLowerCase();
      const brandLower = brand.toLowerCase();

      let targetCategory = "";
      let targetSubCategory = "";

      const isAccessory = categoriesLower.includes("accessories") || 
                          categoriesLower.includes("case") || 
                          categoriesLower.includes("charger") || 
                          categoriesLower.includes("cable") || 
                          categoriesLower.includes("power bank") || 
                          categoriesLower.includes("adapter") ||
                          categoriesLower.includes("mount") ||
                          categoriesLower.includes("screen protector");

      const isMobilePhone = (categoriesLower.includes("cell phones") || 
                             categoriesLower.includes("unlocked phones") || 
                             categoriesLower.includes("prepaid phones") || 
                             categoriesLower.includes("smartphones") ||
                             categoriesLower.includes("mobile phones")) && 
                            !isAccessory &&
                            !nameLower.includes("speaker") &&
                            !nameLower.includes("headphone") &&
                            !nameLower.includes("earphone") &&
                            !nameLower.includes("adapter") &&
                            !nameLower.includes("cable") &&
                            !nameLower.includes("charger") &&
                            !nameLower.includes("case");

      if (isMobilePhone) {
        // Rule 9: Mobiles section
        targetCategory = "Mobiles";
        if (brandLower.includes("apple") || nameLower.includes("iphone")) {
          targetSubCategory = "IPHONE";
        } else if (brandLower.includes("samsung")) {
          targetSubCategory = "SAMSUNG";
        } else if (brandLower.includes("realme")) {
          targetSubCategory = "REALME";
        } else if (brandLower.includes("infinix")) {
          targetSubCategory = "INFINIX";
        } else if (brandLower.includes("motorola") || brandLower.includes("moto")) {
          targetSubCategory = "MOTOROLA";
        } else if (brandLower.includes("poco")) {
          targetSubCategory = "POCO";
        } else if (brandLower.includes("google") || brandLower.includes("pixel")) {
          targetSubCategory = "GOOGLE";
        } else if (brandLower.includes("tecno")) {
          targetSubCategory = "TECNO";
        } else if (brandLower.includes("nothing")) {
          targetSubCategory = "NOTHING";
        } else if (brandLower.includes("vivo")) {
          targetSubCategory = "VIVO";
        } else if (brandLower.includes("oppo")) {
          targetSubCategory = "OPPO";
        } else if (brandLower.includes("redmi") || brandLower.includes("xiaomi") || brandLower.includes("mi")) {
          targetSubCategory = "REDMI";
        } else if (brandLower.includes("hmd")) {
          targetSubCategory = "HMD";
        } else if (brandLower.includes("snapdragon")) {
          targetSubCategory = "SNAPDRAGON";
        } else {
          targetSubCategory = "AI+";
        }
      } else if (isAccessory && (categoriesLower.includes("cell phone") || categoriesLower.includes("mobile"))) {
        // Rule 8: Mobile accessories -> Chargers & Cable
        targetCategory = "Electronics";
        targetSubCategory = "Chargers & Cable";
      } else if (categoriesLower.includes("laptop")) {
        // Rule 6: Laptops
        targetCategory = "Electronics";
        targetSubCategory = "Laptops";
      } else if (categoriesLower.includes("tablet") || categoriesLower.includes("ipad") || categoriesLower.includes("computers & tablets")) {
        // Rule 1: Tablets
        targetCategory = "Electronics";
        targetSubCategory = "Tablets";
      } else if (categoriesLower.includes("audio") || categoriesLower.includes("speaker") || categoriesLower.includes("home theater") || categoriesLower.includes("soundbar") || categoriesLower.includes("subwoofer")) {
        // Rule 2: Audio & speakers -> Speakers
        targetCategory = "Electronics";
        targetSubCategory = "Speakers";
      } else if (categoriesLower.includes("tv") || categoriesLower.includes("television")) {
        // Rule 3: TV -> Networking
        targetCategory = "Electronics";
        targetSubCategory = "Networking";
      } else if (categoriesLower.includes("camera") || categoriesLower.includes("camcorder") || categoriesLower.includes("photography")) {
        // Rule 4: Cameras -> Camera
        targetCategory = "Electronics";
        targetSubCategory = "Camera";
      } else if (categoriesLower.includes("computer component") || categoriesLower.includes("computer accessories") || categoriesLower.includes("hard drive") || categoriesLower.includes("ssd") || categoriesLower.includes("memory card") || categoriesLower.includes("usb flash") || categoriesLower.includes("storage")) {
        // Rule 5: Components -> Storage
        targetCategory = "Electronics";
        targetSubCategory = "Storage";
      } else if (categoriesLower.includes("car electronics") || categoriesLower.includes("gps") || categoriesLower.includes("navigation") || categoriesLower.includes("vehicle electronics")) {
        // Rule 7: Car Electronics & GPS -> Two wheelers
        targetCategory = "Electronics";
        targetSubCategory = "Two wheelers";
      }

      // Skip row if it doesn't match our target rules
      if (!targetCategory || !targetSubCategory) {
        skippedCount++;
        continue;
      }

      // 3. Prevent duplicates by name
      const existCheck = await db.query(
        "SELECT id FROM products WHERE name = $1 LIMIT 1",
        [productName]
      );
      if (existCheck.rows.length > 0) {
        duplicateCount++;
        continue;
      }

      // 4. Price conversion (USD to INR, times 83)
      const usdPrice = parseFloat(rawPrice);
      if (isNaN(usdPrice) || usdPrice <= 0) {
        skippedCount++;
        continue;
      }
      let price = Math.round(usdPrice * 83);
      if (price > 99999) {
        price = 99999;
      }
      const originalPrice = Math.round(price * 1.35); // 35% markup for regular price
      const discountPercentage = 25; // 25% flat discount

      // 5. Description construction
      const description = `High-quality ${productName} by ${brand || manufacturer || 'Premium Brand'}.${weight ? ` Weight: ${weight}.` : ''} High-performance product perfect for everyday needs in ${targetCategory} -> ${targetSubCategory}.`;

      // 6. Default stock, rating and offer type
      const stock = Math.floor(Math.random() * 50) + 30; // Random stock 30-80
      const ratings = (Math.random() * 1.2 + 3.8).toFixed(1); // Random rating between 3.8 and 5.0
      
      const offerTypes = ["HOTDEAL", "BESTSELLER", "NEW"];
      const offerType = offerTypes[insertedCount % offerTypes.length];

      // 7. Insert to DB using parameterized query
      await db.query(
        `INSERT INTO products (
          name, description, price, category, sub_category, stock, ratings, images, 
          created_by, original_price, discount_percentage, offer_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12)`,
        [
          productName,
          description,
          price,
          targetCategory,
          targetSubCategory,
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
      if (insertedCount % 100 === 0) {
        console.log(`  ▓ Progress: Imported ${insertedCount} products...`);
      }
    }

    console.log("\n📊 Seeding Complete Summary:");
    console.log(`   - Successfully Imported: ${insertedCount} products`);
    console.log(`   - Skipped (no valid/clear images): ${badImageCount} products`);
    console.log(`   - Skipped (invalid price/no category): ${skippedCount} products`);
    console.log(`   - Skipped (duplicates by name): ${duplicateCount} products`);

  } catch (error) {
    console.error("❌ Database seeding failed:", error.message);
  } finally {
    await db.end();
    console.log("🔌 Database connection closed.");
  }
}

seedElectronics();
