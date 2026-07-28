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
const MOBILES_DIR_PATH = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/mobiles";
const PUBLIC_IMAGES_DIR = "/Users/premdeepkumargupta/Desktop/ECOMMERCE-FRONTEND-PLATE 0/public/mobiles/images";

const BRAND_FALLBACKS = {
  SAMSUNG: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop",
  IPHONE: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600&auto=format&fit=crop",
  REALME: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop",
  INFINIX: "https://images.unsplash.com/photo-1598327106026-d9521da673d1?q=80&w=600&auto=format&fit=crop",
  MOTOROLA: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
  POCO: "https://images.unsplash.com/photo-1598327106026-d9521da673d1?q=80&w=600&auto=format&fit=crop",
  GOOGLE: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop",
  TECNO: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
  NOTHING: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop",
  VIVO: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop",
  OPPO: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop",
  REDMI: "https://images.unsplash.com/photo-1598327106026-d9521da673d1?q=80&w=600&auto=format&fit=crop",
  NOKIA: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
  ONEPLUS: "https://images.unsplash.com/photo-1565630916779-e303be97b6f5?q=80&w=600&auto=format&fit=crop",
  LAVA: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
  MICROMAX: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
  GIONEE: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
  ITEL: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
  GENERAL: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop"
};

// Robust CSV parser
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

// Extract Brand/Sub-category from name
function getBrandSubCategory(productName) {
  const nameLower = productName.toLowerCase();
  
  if (nameLower.includes("samsung")) return "SAMSUNG";
  if (nameLower.includes("apple") || nameLower.includes("iphone")) return "IPHONE";
  if (nameLower.includes("realme")) return "REALME";
  if (nameLower.includes("infinix")) return "INFINIX";
  if (nameLower.includes("motorola") || nameLower.includes("moto ")) return "MOTOROLA";
  if (nameLower.includes("poco")) return "POCO";
  if (nameLower.includes("google") || nameLower.includes("pixel")) return "GOOGLE";
  if (nameLower.includes("tecno")) return "TECNO";
  if (nameLower.includes("nothing")) return "NOTHING";
  if (nameLower.includes("vivo")) return "VIVO";
  if (nameLower.includes("oppo")) return "OPPO";
  if (nameLower.includes("redmi") || nameLower.includes("xiaomi") || nameLower.includes("mi ")) return "REDMI";
  if (nameLower.includes("nokia")) return "NOKIA";
  if (nameLower.includes("i kall") || nameLower.includes("ikall")) return "I KALL";
  if (nameLower.includes("iair")) return "IAIR";
  if (nameLower.includes("cellecor")) return "CELLECOR";
  if (nameLower.includes("oneplus")) return "ONEPLUS";
  if (nameLower.includes("lava")) return "LAVA";
  if (nameLower.includes("micromax")) return "MICROMAX";
  if (nameLower.includes("gionee")) return "GIONEE";
  if (nameLower.includes("itel")) return "ITEL";
  
  return "GENERAL";
}

async function seedMobiles() {
  try {
    console.log("🔌 Connecting to Database...");
    
    if (!fs.existsSync(MOBILES_DIR_PATH)) {
      console.error("❌ Mobiles directory not found!");
      return;
    }

    const files = fs.readdirSync(MOBILES_DIR_PATH);
    const csvFiles = files.filter(f => f.endsWith(".csv"));
    console.log(`📂 Found ${csvFiles.length} CSV files inside mobiles/ directory.`);

    // Step 1: Pre-scan files that contain u_id to build a name-to-image mapping
    console.log("🔍 Scanning for available product images on disk...");
    const nameToImageMap = new Map();

    for (const csvFile of csvFiles) {
      const filePath = path.join(MOBILES_DIR_PATH, csvFile);
      const datePrefix = csvFile.replace(".csv", "");
      
      const parsed = parseCSV(filePath);
      if (parsed.length <= 1) continue;

      const headers = parsed[0].map(h => h.trim());
      const uIdIdx = headers.indexOf("u_id");
      const nameIdx = headers.indexOf("name");

      if (uIdIdx === -1 || nameIdx === -1) continue;

      for (let i = 1; i < parsed.length; i++) {
        const row = parsed[i];
        if (row.length < headers.length) continue;

        const name = row[nameIdx]?.trim();
        const uId = row[uIdIdx]?.trim();

        if (!name || !uId) continue;

        const absoluteImagePath = path.join(PUBLIC_IMAGES_DIR, datePrefix, `${uId}.jpg`);
        if (fs.existsSync(absoluteImagePath)) {
          const relativeImagePath = `/mobiles/images/${datePrefix}/${uId}.jpg`;
          nameToImageMap.set(name.toLowerCase(), {
            url: relativeImagePath,
            public_id: `mobiles/${uId}`
          });
        }
      }
    }

    console.log(`ℹ️ Built name-to-image map with ${nameToImageMap.size} unique mappings.`);

    // Step 2: Cache existing scraped mobile galleries from DB
    console.log("📥 Caching existing scraped mobile galleries...");
    const scrapedRes = await db.query(`
      SELECT name, images, video, item_link 
      FROM products 
      WHERE category = 'Mobiles' 
        AND images::text LIKE '%rukminim1.flixcart.com%'
    `);
    const scrapedCache = new Map();
    for (const row of scrapedRes.rows) {
      const nameKey = row.name.toLowerCase().trim();
      if (!scrapedCache.has(nameKey)) {
        scrapedCache.set(nameKey, {
          images: row.images,
          video: row.video,
          item_link: row.item_link
        });
      }
    }
    console.log(`✅ Cached ${scrapedCache.size} scraped mobile galleries.`);

    // Step 3: Clear pre-existing mobiles in database
    console.log("🧹 Clearing all existing Mobile products from DB...");
    const clearRes = await db.query("DELETE FROM products WHERE category = 'Mobiles'");
    console.log(`🗑️ Removed ${clearRes.rowCount} mobile products.`);

    // Step 4: Seed products from all CSV files with in-memory duplicate check (up to 5 entries)
    const uniqueProductsMap = new Map();
    let totalSkipped = 0;

    for (const csvFile of csvFiles) {
      const filePath = path.join(MOBILES_DIR_PATH, csvFile);
      const datePrefix = csvFile.replace(".csv", "");
      
      console.log(`📖 Parsing ${csvFile}...`);
      const parsed = parseCSV(filePath);
      if (parsed.length <= 1) continue;

      const headers = parsed[0].map(h => h.trim());
      const uIdIdx = headers.indexOf("u_id");
      const nameIdx = headers.indexOf("name");
      const offerPriceIdx = headers.indexOf("offer_price");
      const originalPriceIdx = headers.indexOf("original_price");
      const ratingIdx = headers.indexOf("rating");
      const descriptionIdx = headers.indexOf("description");
      const itemLinkIdx = headers.indexOf("item_link");

      if (nameIdx === -1 || offerPriceIdx === -1) {
        console.warn(`  ⚠️ Missing required headers in ${csvFile}, skipping file.`);
        continue;
      }

      for (let i = 1; i < parsed.length; i++) {
        const row = parsed[i];
        if (row.length < headers.length) continue;

        const name = row[nameIdx]?.trim();
        if (!name) {
          totalSkipped++;
          continue;
        }

        const uId = uIdIdx !== -1 ? row[uIdIdx]?.trim() : "";
        const offerPrice = row[offerPriceIdx]?.trim() || "";
        const originalPriceRaw = originalPriceIdx !== -1 ? row[originalPriceIdx]?.trim() : "";
        const rating = ratingIdx !== -1 ? row[ratingIdx]?.trim() : "4.2";
        const description = descriptionIdx !== -1 ? row[descriptionIdx]?.trim() : "";
        const itemLink = itemLinkIdx !== -1 ? row[itemLinkIdx]?.trim() : "";

        // Parse price and original price
        const priceNum = parseFloat(offerPrice.replace(/[^0-9.]/g, ""));
        if (isNaN(priceNum) || priceNum <= 0) {
          totalSkipped++;
          continue;
        }

        let origPriceNum = originalPriceRaw ? parseFloat(originalPriceRaw.replace(/[^0-9.]/g, "")) : 0;
        if (isNaN(origPriceNum) || origPriceNum <= priceNum) {
          origPriceNum = Math.round(priceNum * 1.25);
        }

        const discountPercentage = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);

        // Clean description
        let cleanedDescription = description.replace(/[\[\]']/g, "").split(",").map(s => s.trim()).filter(Boolean).join(". ");
        if (!cleanedDescription) {
          cleanedDescription = `High quality mobile smartphone: ${name}.`;
        }

        const subCategory = getBrandSubCategory(name);

        // Resolve Image URL
        let imagesArray = [];
        let hasRealImage = false;
        if (uId) {
          const absoluteImagePath = path.join(PUBLIC_IMAGES_DIR, datePrefix, `${uId}.jpg`);
          if (fs.existsSync(absoluteImagePath)) {
            imagesArray = [{
              url: `/mobiles/images/${datePrefix}/${uId}.jpg`,
              public_id: `mobiles/${uId}`
            }];
            hasRealImage = true;
          }
        }

        // Fallback 1: Match by name in pre-scanned map
        if (imagesArray.length === 0 && nameToImageMap.has(name.toLowerCase())) {
          imagesArray = [nameToImageMap.get(name.toLowerCase())];
          hasRealImage = true;
        }

        // Fallback 2: Brand fallback image
        if (imagesArray.length === 0) {
          const fallbackUrl = BRAND_FALLBACKS[subCategory] || BRAND_FALLBACKS.GENERAL;
          imagesArray = [{
            url: fallbackUrl,
            public_id: `mobiles/fallback_${subCategory.toLowerCase()}_${uniqueProductsMap.size}`
          }];
        }

        const ratingNum = parseFloat(rating) || 4.2;

        const productKey = name.toLowerCase().trim();
        let existingList = uniqueProductsMap.get(productKey);
        if (!existingList) {
          existingList = [];
          uniqueProductsMap.set(productKey, existingList);
        }

        const newProd = {
          name,
          description: cleanedDescription,
          price: priceNum,
          category: "Mobiles",
          sub_category: subCategory,
          stock: Math.floor(Math.random() * 50) + 20,
          ratings: ratingNum,
          images: imagesArray,
          original_price: origPriceNum,
          discount_percentage: discountPercentage,
          item_link: itemLink,
          hasRealImage
        };

        if (existingList.length < 1) {
          existingList.push(newProd);
        } else {
          // If we already have 1, replace it if the new one has a real image or higher rating
          const fallbackIndex = existingList.findIndex(p => !p.hasRealImage);
          if (fallbackIndex !== -1 && hasRealImage) {
            existingList[fallbackIndex] = newProd;
          } else {
            let lowestIdx = 0;
            for (let k = 1; k < existingList.length; k++) {
              if (existingList[k].ratings < existingList[lowestIdx].ratings) {
                lowestIdx = k;
              }
            }
            if (ratingNum > existingList[lowestIdx].ratings) {
              existingList[lowestIdx] = newProd;
            }
          }
        }
      }
    }

    console.log(`\nℹ️ Deduplication done: Found ${uniqueProductsMap.size} unique product models. Inserting into DB...`);

    let totalInserted = 0;
    const offerTypes = ["HOTDEAL", "BESTSELLER", "NEW"];

    for (const [key, list] of uniqueProductsMap.entries()) {
      for (const prod of list) {
        const offerType = offerTypes[totalInserted % offerTypes.length];
        
        // Try to match with existing scraped gallery
        const cached = scrapedCache.get(key);
        let finalImages = prod.images;
        let finalVideo = null;
        let finalItemLink = prod.item_link;

        if (cached) {
          finalImages = cached.images;
          finalVideo = cached.video;
          if (cached.item_link) {
            finalItemLink = cached.item_link;
          }
        }

        await db.query(
          `INSERT INTO products (
            name, description, price, category, sub_category, stock, ratings, images, video, 
            created_by, original_price, discount_percentage, offer_type, item_link
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13, $14)`,
          [
            prod.name,
            prod.description,
            prod.price,
            prod.category,
            prod.sub_category,
            prod.stock,
            prod.ratings,
            JSON.stringify(finalImages),
            JSON.stringify(finalVideo),
            ADMIN_ID,
            prod.original_price,
            prod.discount_percentage,
            offerType,
            finalItemLink
          ]
        );

        totalInserted++;
        if (totalInserted % 500 === 0) {
          console.log(`  ▓ Progress: Imported ${totalInserted} mobiles...`);
        }
      }
    }

    console.log("\n📊 Seeding Complete Summary:");
    console.log(`   - Successfully Imported: ${totalInserted} mobile products (with duplicates up to 5 times)`);
    console.log(`   - Skipped/Malformed: ${totalSkipped} records`);

  } catch (error) {
    console.error("❌ Database seeding failed:", error.message);
  } finally {
    await db.end();
    console.log("🔌 Database connection closed.");
  }
}

seedMobiles();
